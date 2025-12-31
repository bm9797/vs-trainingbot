/**
 * RAG (Retrieval Augmented Generation) helper functions
 * Handles context retrieval from Pinecone and formatting for LLM prompts
 */

import { generateEmbedding } from "./openai";
import { queryPinecone } from "./pinecone";
import { PINECONE_CONFIG } from "./constants";

/**
 * Metadata stored with each document chunk in Pinecone
 */
export interface ChunkMetadata {
  text: string;
  source: string;
  title?: string;
  category?: string;
  chunkIndex?: number;
  totalChunks?: number;
}

/**
 * Retrieved chunk with similarity score
 */
export interface RetrievedChunk {
  id: string;
  score: number;
  metadata: ChunkMetadata;
}

/**
 * Formatted context for LLM prompt
 */
export interface FormattedContext {
  contextText: string;
  sources: Array<{
    source: string;
    title?: string;
    category?: string;
  }>;
}

/**
 * Retrieve relevant context chunks from Pinecone for a user query
 *
 * @param query - The user's question
 * @param topK - Number of chunks to retrieve (default from constants)
 * @returns Array of retrieved chunks with metadata and scores
 */
export async function retrieveContext(
  query: string,
  topK: number = PINECONE_CONFIG.topK
): Promise<RetrievedChunk[]> {
  // Generate embedding for the query
  const queryEmbedding = await generateEmbedding(query);

  // Query Pinecone for similar chunks
  const matches = await queryPinecone(queryEmbedding, topK);

  // Filter by minimum score and map to our interface
  const retrievedChunks: RetrievedChunk[] = matches
    .filter((match) => (match.score ?? 0) >= PINECONE_CONFIG.minScore)
    .map((match) => ({
      id: match.id,
      score: match.score ?? 0,
      metadata: {
        text: (match.metadata?.text as string) || "",
        source: (match.metadata?.source as string) || "Unknown",
        title: match.metadata?.title as string | undefined,
        category: match.metadata?.category as string | undefined,
        chunkIndex: match.metadata?.chunkIndex as number | undefined,
        totalChunks: match.metadata?.totalChunks as number | undefined,
      },
    }));

  return retrievedChunks;
}

/**
 * Format retrieved chunks into a context string for the LLM prompt
 * Includes source citations for reference
 *
 * @param chunks - Array of retrieved chunks from Pinecone
 * @returns Formatted context with source information
 */
export function formatContextForPrompt(chunks: RetrievedChunk[]): FormattedContext {
  if (chunks.length === 0) {
    return {
      contextText: "",
      sources: [],
    };
  }

  // Track unique sources for citation
  const sourcesMap = new Map<string, { source: string; title?: string; category?: string }>();

  // Build context sections with source references
  const contextSections = chunks.map((chunk, index) => {
    const sourceKey = chunk.metadata.source;
    const sourceNum = index + 1;

    // Track unique sources
    if (!sourcesMap.has(sourceKey)) {
      sourcesMap.set(sourceKey, {
        source: chunk.metadata.source,
        title: chunk.metadata.title,
        category: chunk.metadata.category,
      });
    }

    // Format the chunk with source reference
    const sourceLabel = chunk.metadata.title || chunk.metadata.source;
    return `[Source ${sourceNum}: ${sourceLabel}]\n${chunk.metadata.text}`;
  });

  // Join all context sections
  const contextText = contextSections.join("\n\n---\n\n");

  return {
    contextText,
    sources: Array.from(sourcesMap.values()),
  };
}

/**
 * Build the complete context section for the system prompt
 * This wraps the formatted context with instructions for the LLM
 *
 * @param formattedContext - The formatted context from formatContextForPrompt
 * @returns Complete context section for the prompt
 */
export function buildContextSection(formattedContext: FormattedContext): string {
  if (!formattedContext.contextText) {
    return `
CONTEXT:
No relevant training documents were found for this query. Please inform the user that you don't have specific information about their question in the knowledge base, and suggest they contact their supervisor or HR for assistance.
`;
  }

  return `
CONTEXT FROM TRAINING DOCUMENTS:
The following information was retrieved from Vitasigns training documents. Use this context to answer the user's question. Always cite the source when providing information.

${formattedContext.contextText}

---

CITATION INSTRUCTIONS:
- Reference specific sources when providing information (e.g., "According to [Source 1]...")
- If information spans multiple sources, cite all relevant sources
- If the retrieved context doesn't fully answer the question, acknowledge what you found and what might be missing
`;
}

/**
 * Main function to retrieve and format context for a query
 * Combines all RAG steps into a single call
 *
 * @param query - The user's question
 * @returns Object containing formatted context and source metadata
 */
export async function getRAGContext(query: string): Promise<{
  contextSection: string;
  sources: FormattedContext["sources"];
  chunks: RetrievedChunk[];
}> {
  // Retrieve relevant chunks
  const chunks = await retrieveContext(query);

  // Format for prompt
  const formattedContext = formatContextForPrompt(chunks);

  // Build the context section
  const contextSection = buildContextSection(formattedContext);

  return {
    contextSection,
    sources: formattedContext.sources,
    chunks,
  };
}
