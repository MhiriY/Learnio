import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class ChunkingService {
  private readonly logger = new Logger(ChunkingService.name);
  // Use word-based chunking: ~400-600 words per chunk (approximately 2000-3000 characters)
  // This is safer than character-based and produces better semantic chunks
  private readonly targetWordsPerChunk = 500;
  private readonly maxCharsPerChunk = 3000; // Hard limit to prevent huge chunks
  private readonly chunkOverlap = 50; // Words to overlap between chunks

  /**
   * Split text into chunks of approximately 400-600 words
   * Uses word-based chunking for better semantic boundaries
   * Returns chunks one at a time via generator to avoid memory issues
   */
  *chunkText(text: string): Generator<string, void, unknown> {
    if (!text || text.trim().length === 0) {
      return;
    }

    // Split into words while preserving whitespace info
    const words = text.split(/(\s+)/);
    let currentChunk: string[] = [];
    let currentWordCount = 0;
    let currentCharCount = 0;
    let chunkIndex = 0;

    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      const wordLength = word.length;
      const isWhitespace = /^\s+$/.test(word);

      // Skip pure whitespace at chunk boundaries
      if (isWhitespace && currentChunk.length === 0) {
        continue;
      }

      // Check if adding this word would exceed limits
      const wouldExceedChars =
        currentCharCount + wordLength > this.maxCharsPerChunk;
      const wouldExceedWords =
        !isWhitespace && currentWordCount >= this.targetWordsPerChunk;

      if ((wouldExceedChars || wouldExceedWords) && currentChunk.length > 0) {
        // Yield current chunk
        const chunkText = currentChunk.join('').trim();
        if (chunkText.length > 0) {
          this.logger.debug(
            `Generated chunk ${chunkIndex}: ${currentWordCount} words, ${currentCharCount} chars`,
          );
          yield chunkText;
          chunkIndex++;
        }

        // Start new chunk with overlap
        const overlapWords = Math.min(
          this.chunkOverlap,
          Math.floor(currentChunk.length / 2),
        );
        currentChunk = currentChunk.slice(-overlapWords);
        currentWordCount = overlapWords;
        currentCharCount = currentChunk.join('').length;
      }

      // Add word to current chunk
      currentChunk.push(word);
      if (!isWhitespace) {
        currentWordCount++;
      }
      currentCharCount += wordLength;
    }

    // Yield final chunk
    if (currentChunk.length > 0) {
      const chunkText = currentChunk.join('').trim();
      if (chunkText.length > 0) {
        this.logger.debug(
          `Generated final chunk ${chunkIndex}: ${currentWordCount} words, ${currentCharCount} chars`,
        );
        yield chunkText;
      }
    }

    this.logger.log(`Chunked text into ${chunkIndex + 1} chunks`);
  }

  /**
   * Get chunk count without generating all chunks (for logging)
   */
  estimateChunkCount(text: string): number {
    if (!text || text.trim().length === 0) {
      return 0;
    }
    const wordCount = text.split(/\s+/).filter((w) => w.length > 0).length;
    return Math.ceil(wordCount / this.targetWordsPerChunk);
  }
}
