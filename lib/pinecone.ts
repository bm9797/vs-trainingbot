import { Pinecone, type RecordMetadata } from "@pinecone-database/pinecone";

/**
 * Pinecone client singleton
 * Initializes connection to Pinecone vector database for document retrieval
 */

let pineconeClient: Pinecone | null = null;

/**
 * Get or create Pinecone client instance
 * Uses singleton pattern to avoid multiple connections
 */
export function getPineconeClient(): Pinecone {
  if (!pineconeClient) {
    const apiKey = process.env.PINECONE_API_KEY;

    if (!apiKey) {
      throw new Error(
        "PINECONE_API_KEY environment variable is not set. " +
          "Please add it to your .env.local file."
      );
    }

    pineconeClient = new Pinecone({
      apiKey,
    });
  }

  return pineconeClient;
}

/**
 * Get the Pinecone index for storing/retrieving training documents
 */
export function getPineconeIndex() {
  const client = getPineconeClient();
  const indexName = process.env.PINECONE_INDEX_NAME;

  if (!indexName) {
    throw new Error(
      "PINECONE_INDEX_NAME environment variable is not set. " +
        "Please add it to your .env.local file."
    );
  }

  return client.index(indexName);
}

/**
 * Query the Pinecone index for similar documents
 * @param embedding - The query embedding vector
 * @param topK - Number of results to return
 * @param filter - Optional metadata filter
 */
export async function queryPinecone(
  embedding: number[],
  topK: number = 5,
  filter?: Record<string, unknown>
) {
  const index = getPineconeIndex();

  const queryResponse = await index.query({
    vector: embedding,
    topK,
    includeMetadata: true,
    filter,
  });

  return queryResponse.matches || [];
}

/**
 * Upsert vectors to the Pinecone index
 * Used during document ingestion
 */
export async function upsertToPinecone(
  vectors: Array<{
    id: string;
    values: number[];
    metadata: RecordMetadata;
  }>
) {
  const index = getPineconeIndex();
  await index.upsert(vectors);
}
