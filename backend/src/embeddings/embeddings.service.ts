import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class EmbeddingsService {
  private readonly logger = new Logger(EmbeddingsService.name);
  private readonly client: OpenAI;
  private readonly model = 'text-embedding-3-small'; // 1536 dimensions - smaller and faster

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      this.logger.error('OPENAI_API_KEY is not configured');
      throw new Error(
        'OPENAI_API_KEY is required but not found in environment variables',
      );
    }
    this.client = new OpenAI({ apiKey });
    this.logger.log(`EmbeddingsService initialized with model: ${this.model}`);
  }

  /**
   * Generate embedding for a single text string
   * This is the preferred method for memory efficiency
   * @param text - The text to generate embedding for
   * @returns Array of numbers representing the embedding vector (1536 dimensions)
   */
  async generateEmbedding(text: string): Promise<number[]> {
    if (!text || text.trim().length === 0) {
      throw new Error('Cannot generate embedding for empty text');
    }

    // Validate text length (OpenAI has token limits)
    if (text.length > 8000) {
      this.logger.warn(
        `Text is very long (${text.length} chars), may exceed token limits`,
      );
    }

    try {
      const response = await this.client.embeddings.create({
        model: this.model,
        input: text.substring(0, 8000), // Safety limit
      });

      const embedding = response.data[0]?.embedding;
      if (!embedding) {
        throw new Error('No embedding returned from OpenAI');
      }

      // Validate embedding size (text-embedding-3-small should be 1536)
      if (embedding.length !== 1536) {
        this.logger.warn(
          `Unexpected embedding dimension: ${embedding.length} (expected 1536)`,
        );
      }

      return embedding;
    } catch (error) {
      this.logger.error(
        `Failed to generate embedding: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw error;
    }
  }

  /**
   * Generate embeddings for multiple texts in batch
   * Use sparingly - only for small batches (max 10)
   * @param texts - Array of texts to generate embeddings for (max 10 recommended)
   * @returns Array of embedding vectors
   */
  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) {
      return [];
    }

    // Safety limit: don't process more than 10 at a time
    if (texts.length > 10) {
      this.logger.warn(
        `Batch size ${texts.length} is large, consider processing in smaller batches`,
      );
    }

    const maxBatchSize = Math.min(texts.length, 10); // Process max 10 at a time
    const allEmbeddings: number[][] = [];

    // Process in small batches
    for (let i = 0; i < texts.length; i += maxBatchSize) {
      const batch = texts.slice(i, i + maxBatchSize);

      try {
        const response = await this.client.embeddings.create({
          model: this.model,
          input: batch.map((t) => t.substring(0, 8000)), // Safety limit per text
        });

        const batchEmbeddings = response.data.map((item) => item.embedding);
        allEmbeddings.push(...batchEmbeddings);
      } catch (error) {
        this.logger.error(
          `Failed to generate embeddings for batch ${Math.floor(i / maxBatchSize) + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`,
        );
        throw error;
      }
    }

    return allEmbeddings;
  }
}
