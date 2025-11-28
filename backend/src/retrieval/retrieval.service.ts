import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmbeddingsService } from '../embeddings/embeddings.service';

interface ChunkWithSimilarity {
  id: string;
  content: string;
  index: number;
  similarity: number;
}

@Injectable()
export class RetrievalService {
  private readonly logger = new Logger(RetrievalService.name);
  private readonly maxChunksToLoad = 100; // Safety limit: don't load more than 100 chunks

  constructor(
    private readonly prisma: PrismaService,
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
   * Retrieve top-K most relevant chunks for a query
   * Memory-safe: processes chunks in batches and doesn't load all at once
   * @param documentId - The document to search in
   * @param userQuery - The user's query/question
   * @param topK - Number of top chunks to return (default: 5)
   * @returns Array of chunks sorted by relevance (highest similarity first)
   */
  async retrieveRelevantChunks(
    documentId: string,
    userQuery: string,
    topK: number = 5,
  ): Promise<ChunkWithSimilarity[]> {
    const startMemory = this.getMemoryUsage();
    this.logger.log(
      `[Memory: ${startMemory}MB] Retrieving chunks for query: "${userQuery.substring(0, 50)}..."`,
    );

    // Verify document exists
    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
      select: { id: true },
    });

    if (!document) {
      throw new NotFoundException(`Document with ID ${documentId} not found`);
    }

    // Get chunk count first (without loading content/embeddings)
    // For JSON fields, we need to fetch and filter in code
    const allChunksCount = await this.prisma.documentChunk.count({
      where: {
        documentId,
      },
    });

    if (allChunksCount === 0) {
      this.logger.warn(
        `No chunks found for document ${documentId}`,
      );
      return [];
    }

    this.logger.log(
      `[Memory: ${this.getMemoryUsage()}MB] Found ${allChunksCount} total chunks`,
    );

    // Safety check: don't process too many chunks
    const chunksToProcess = Math.min(allChunksCount, this.maxChunksToLoad);
    if (allChunksCount > this.maxChunksToLoad) {
      this.logger.warn(
        `Document has ${allChunksCount} chunks (exceeds limit of ${this.maxChunksToLoad}). Processing first ${this.maxChunksToLoad} chunks only.`,
      );
    }

    // Generate embedding for the query ONCE
    const queryEmbedding = await this.embeddingsService.generateEmbedding(
      userQuery,
    );

    this.logger.log(
      `[Memory: ${this.getMemoryUsage()}MB] Generated query embedding (${queryEmbedding.length} dimensions)`,
    );

    // Process chunks in batches to avoid loading all into memory
    const batchSize = 20; // Process 20 chunks at a time
    const allSimilarities: ChunkWithSimilarity[] = [];

    for (let offset = 0; offset < chunksToProcess; offset += batchSize) {
      const batch = await this.prisma.documentChunk.findMany({
        where: {
          documentId,
        },
        select: {
          id: true,
          content: true,
          index: true,
          embedding: true,
        },
        orderBy: { index: 'asc' },
        skip: offset,
        take: batchSize,
      });

      // Calculate similarity for this batch
      for (const chunk of batch) {
        const chunkEmbedding = chunk.embedding as number[] | null;
        if (!chunkEmbedding || !Array.isArray(chunkEmbedding)) {
          continue;
        }

        const similarity = this.cosineSimilarity(
          queryEmbedding,
          chunkEmbedding,
        );

        allSimilarities.push({
          id: chunk.id,
          content: chunk.content,
          index: chunk.index,
          similarity,
        });
      }

      this.logger.debug(
        `[Memory: ${this.getMemoryUsage()}MB] Processed batch ${Math.floor(offset / batchSize) + 1}, ${allSimilarities.length} similarities calculated`,
      );
    }

    // Sort and return top K
    const topChunks = allSimilarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topK);

    const endMemory = this.getMemoryUsage();
    this.logger.log(
      `[Memory: ${endMemory}MB] Retrieved ${topChunks.length} relevant chunks. Memory delta: ${endMemory - startMemory}MB`,
    );

    return topChunks;
  }

  /**
   * Calculate cosine similarity between two vectors
   * @param vecA - First vector
   * @param vecB - Second vector
   * @returns Cosine similarity score between -1 and 1
   */
  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) {
      this.logger.warn(
        `Vector length mismatch: ${vecA.length} vs ${vecB.length}`,
      );
      return 0;
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    const denominator = Math.sqrt(normA) * Math.sqrt(normB);
    if (denominator === 0) {
      return 0;
    }

    return dotProduct / denominator;
  }
}
