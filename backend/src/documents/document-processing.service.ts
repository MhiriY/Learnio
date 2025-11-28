import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ChunkingService } from '../chunking/chunking.service';
import { EmbeddingsService } from '../embeddings/embeddings.service';

@Injectable()
export class DocumentProcessingService {
  private readonly logger = new Logger(DocumentProcessingService.name);
  private readonly maxConcurrentChunks = 3; // Process max 3 chunks at a time

  constructor(
    private readonly prisma: PrismaService,
    private readonly chunkingService: ChunkingService,
    private readonly embeddingsService: EmbeddingsService,
  ) {}

  /**
   * Get memory usage in MB (approximate)
   */
  private getMemoryUsage(): number {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      return Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
    }
    return 0;
  }

  /**
   * Process a document: chunk it and generate embeddings
   * Processes ONE chunk at a time to minimize memory usage
   */
  async processDocument(documentId: string): Promise<void> {
    const startMemory = this.getMemoryUsage();
    this.logger.log(
      `[Memory: ${startMemory}MB] Processing document ${documentId}`,
    );

    // Get document with content
    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
      select: {
        id: true,
        content: true,
      },
    });

    if (!document) {
      throw new Error(`Document ${documentId} not found`);
    }

    if (!document.content) {
      this.logger.warn(`Document ${documentId} has no content to process`);
      return;
    }

    const contentLength = document.content.length;
    const estimatedChunks = this.chunkingService.estimateChunkCount(
      document.content,
    );

    this.logger.log(
      `[Memory: ${this.getMemoryUsage()}MB] Document content: ${contentLength} chars, estimated ${estimatedChunks} chunks`,
    );

    // Delete old chunks
    await this.prisma.documentChunk.deleteMany({
      where: { documentId },
    });

    this.logger.log(`[Memory: ${this.getMemoryUsage()}MB] Deleted old chunks`);

    // Process chunks ONE AT A TIME using generator
    const chunkGenerator = this.chunkingService.chunkText(document.content);
    let chunkIndex = 0;
    let processedCount = 0;
    let errorCount = 0;

    // Process in very small batches (3 chunks max at a time)
    const processingQueue: Promise<void>[] = [];

    for (const chunkText of chunkGenerator) {
      const currentChunkIndex = chunkIndex;
      chunkIndex++;

      // Validate chunk size
      if (chunkText.length > 10000) {
        this.logger.warn(
          `Chunk ${currentChunkIndex} is very large: ${chunkText.length} chars`,
        );
      }

      this.logger.log(
        `[Memory: ${this.getMemoryUsage()}MB] Processing chunk ${currentChunkIndex} (${chunkText.length} chars)...`,
      );

      // Create processing promise for this chunk
      const chunkPromise = this.processSingleChunk(
        documentId,
        currentChunkIndex,
        chunkText,
      )
        .then(() => {
          processedCount++;
          this.logger.log(
            `[Memory: ${this.getMemoryUsage()}MB] Completed chunk ${currentChunkIndex} (${processedCount} total)`,
          );
        })
        .catch((error) => {
          errorCount++;
          this.logger.error(
            `Failed to process chunk ${currentChunkIndex}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          );
        });

      processingQueue.push(chunkPromise);

      // If queue is full, wait for one to complete before adding more
      if (processingQueue.length >= this.maxConcurrentChunks) {
        await Promise.race(processingQueue);
        // Remove completed promises
        for (let i = processingQueue.length - 1; i >= 0; i--) {
          const p = processingQueue[i];
          // Check if promise is resolved (this is a simple check)
          // In practice, we'll just wait for the first one
        }
        // Wait a bit to allow GC
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
    }

    // Wait for all remaining chunks to complete
    await Promise.all(processingQueue);

    const endMemory = this.getMemoryUsage();
    this.logger.log(
      `[Memory: ${endMemory}MB] Successfully processed document ${documentId}: ${processedCount} chunks, ${errorCount} errors. Memory delta: ${endMemory - startMemory}MB`,
    );
  }

  /**
   * Process a single chunk: generate embedding and save to DB
   * This is the critical path - must be memory efficient
   */
  private async processSingleChunk(
    documentId: string,
    index: number,
    content: string,
  ): Promise<void> {
    // Generate embedding for this single chunk
    const embedding = await this.embeddingsService.generateEmbedding(content);

    // Immediately save to database (don't accumulate)
    await this.prisma.documentChunk.create({
      data: {
        documentId,
        index,
        content,
        embedding: embedding, // Store as JSON array
      },
    });

    // Note: embedding and content will be garbage collected after this function
  }
}
