import OpenAI from "openai";
import { EMBEDDING_CONFIG } from "./constants";

/**
 * OpenAI client singleton
 * Used for generating embeddings and chat completions
 */

let openaiClient: OpenAI | null = null;

/**
 * Get or create OpenAI client instance
 * Uses singleton pattern to avoid multiple client instantiations
 */
export function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error(
        "OPENAI_API_KEY environment variable is not set. " +
          "Please add it to your .env.local file."
      );
    }

    openaiClient = new OpenAI({
      apiKey,
    });
  }

  return openaiClient;
}

/**
 * Generate embeddings for text using OpenAI's embedding model
 * Used for both document ingestion and query processing
 * @param text - The text to embed
 * @returns The embedding vector
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const client = getOpenAIClient();

  const response = await client.embeddings.create({
    model: EMBEDDING_CONFIG.model,
    input: text,
  });

  return response.data[0].embedding;
}

/**
 * Generate embeddings for multiple texts in batch
 * More efficient for processing multiple documents
 * @param texts - Array of texts to embed
 * @returns Array of embedding vectors
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const client = getOpenAIClient();

  const response = await client.embeddings.create({
    model: EMBEDDING_CONFIG.model,
    input: texts,
  });

  return response.data.map((item) => item.embedding);
}
