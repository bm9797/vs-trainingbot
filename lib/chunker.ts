/**
 * Text Chunking Utility
 * Splits text into overlapping chunks for embedding generation
 * Attempts to split on sentence boundaries when possible
 */

export interface ChunkConfig {
  chunkSize: number;
  chunkOverlap: number;
}

export interface TextChunk {
  text: string;
  chunkIndex: number;
  startOffset: number;
  endOffset: number;
}

/**
 * Default chunking configuration
 */
export const DEFAULT_CHUNK_CONFIG: ChunkConfig = {
  chunkSize: 1000,
  chunkOverlap: 200,
};

/**
 * Sentence ending patterns for boundary detection
 */
const SENTENCE_ENDINGS = /[.!?]\s+/g;

/**
 * Find the best split point near a target position
 * Prefers sentence boundaries, falls back to word boundaries
 */
function findBestSplitPoint(
  text: string,
  targetPosition: number,
  searchRange: number = 100
): number {
  // Don't search beyond the text length
  const searchStart = Math.max(0, targetPosition - searchRange);
  const searchEnd = Math.min(text.length, targetPosition + searchRange);
  const searchText = text.substring(searchStart, searchEnd);

  // Look for sentence endings in the search range
  let bestSentenceEnd = -1;
  let match: RegExpExecArray | null;
  const sentenceRegex = new RegExp(SENTENCE_ENDINGS.source, "g");

  while ((match = sentenceRegex.exec(searchText)) !== null) {
    const absolutePosition = searchStart + match.index + match[0].length;
    if (
      absolutePosition <= targetPosition + searchRange &&
      absolutePosition >= targetPosition - searchRange
    ) {
      // Prefer positions closer to target
      if (
        bestSentenceEnd === -1 ||
        Math.abs(absolutePosition - targetPosition) <
          Math.abs(bestSentenceEnd - targetPosition)
      ) {
        bestSentenceEnd = absolutePosition;
      }
    }
  }

  if (bestSentenceEnd !== -1) {
    return bestSentenceEnd;
  }

  // Fall back to word boundary (space)
  const spaceBeforeTarget = text.lastIndexOf(" ", targetPosition);
  const spaceAfterTarget = text.indexOf(" ", targetPosition);

  if (spaceBeforeTarget !== -1 && spaceAfterTarget !== -1) {
    // Choose the closer one
    return Math.abs(spaceBeforeTarget - targetPosition) <
      Math.abs(spaceAfterTarget - targetPosition)
      ? spaceBeforeTarget + 1
      : spaceAfterTarget + 1;
  } else if (spaceBeforeTarget !== -1) {
    return spaceBeforeTarget + 1;
  } else if (spaceAfterTarget !== -1) {
    return spaceAfterTarget + 1;
  }

  // No good split point found, use target position
  return targetPosition;
}

/**
 * Clean text by normalizing whitespace and removing excessive newlines
 */
function cleanText(text: string): string {
  return text
    .replace(/\r\n/g, "\n") // Normalize line endings
    .replace(/\n{3,}/g, "\n\n") // Reduce multiple newlines
    .replace(/[ \t]+/g, " ") // Normalize spaces
    .trim();
}

/**
 * Split text into overlapping chunks
 * Attempts to split on sentence boundaries when possible
 *
 * @param text - The text to split
 * @param config - Chunking configuration (size and overlap)
 * @returns Array of text chunks with metadata
 */
export function splitTextIntoChunks(
  text: string,
  config: ChunkConfig = DEFAULT_CHUNK_CONFIG
): TextChunk[] {
  const { chunkSize, chunkOverlap } = config;

  // Validate config
  if (chunkOverlap >= chunkSize) {
    throw new Error("Chunk overlap must be less than chunk size");
  }

  // Clean the text
  const cleanedText = cleanText(text);

  // If text is shorter than chunk size, return single chunk
  if (cleanedText.length <= chunkSize) {
    return [
      {
        text: cleanedText,
        chunkIndex: 0,
        startOffset: 0,
        endOffset: cleanedText.length,
      },
    ];
  }

  const chunks: TextChunk[] = [];
  let currentPosition = 0;
  let chunkIndex = 0;

  while (currentPosition < cleanedText.length) {
    // Calculate the ideal end position for this chunk
    let endPosition = currentPosition + chunkSize;

    // If this would be the last chunk, just take the rest
    if (endPosition >= cleanedText.length) {
      const chunkText = cleanedText.substring(currentPosition).trim();
      if (chunkText.length > 0) {
        chunks.push({
          text: chunkText,
          chunkIndex,
          startOffset: currentPosition,
          endOffset: cleanedText.length,
        });
      }
      break;
    }

    // Find the best split point near the target end position
    endPosition = findBestSplitPoint(cleanedText, endPosition);

    // Extract the chunk
    const chunkText = cleanedText.substring(currentPosition, endPosition).trim();

    if (chunkText.length > 0) {
      chunks.push({
        text: chunkText,
        chunkIndex,
        startOffset: currentPosition,
        endOffset: endPosition,
      });
      chunkIndex++;
    }

    // Move to next position with overlap
    currentPosition = endPosition - chunkOverlap;

    // Prevent infinite loop if overlap is larger than the chunk
    if (currentPosition <= chunks[chunks.length - 1]?.startOffset) {
      currentPosition = endPosition;
    }
  }

  return chunks;
}

/**
 * Estimate the number of chunks that will be created from text
 * Useful for progress estimation
 */
export function estimateChunkCount(
  textLength: number,
  config: ChunkConfig = DEFAULT_CHUNK_CONFIG
): number {
  const { chunkSize, chunkOverlap } = config;
  const effectiveStride = chunkSize - chunkOverlap;
  return Math.ceil(textLength / effectiveStride);
}
