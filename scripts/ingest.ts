/**
 * PDF Ingestion Script
 * Reads PDF files from /docs folder, extracts text, generates embeddings,
 * and upserts vectors to Pinecone for semantic search
 *
 * Usage: npm run ingest
 */

import * as fs from "fs";
import * as path from "path";
import * as pdf from "pdf-parse";
import { config } from "dotenv";

// Load environment variables from .env.local
config({ path: path.join(process.cwd(), ".env.local") });

import { generateEmbeddings } from "../lib/openai";
import { upsertToPinecone } from "../lib/pinecone";
import { splitTextIntoChunks, DEFAULT_CHUNK_CONFIG } from "../lib/chunker";
import { EMBEDDING_CONFIG } from "../lib/constants";
import type { RecordMetadata } from "@pinecone-database/pinecone";

/**
 * Configuration
 */
const DOCS_FOLDER = path.join(process.cwd(), "docs");
const BATCH_SIZE = 10; // Number of embeddings to generate per batch (avoid rate limits)
const UPSERT_BATCH_SIZE = 100; // Number of vectors to upsert per batch

/**
 * Metadata for each document chunk
 */
interface ChunkMetadata extends RecordMetadata {
  source: string;
  pageNumber: number;
  chunkIndex: number;
  totalChunks: number;
  text: string;
}

/**
 * Processed chunk ready for embedding
 */
interface ProcessedChunk {
  id: string;
  text: string;
  metadata: ChunkMetadata;
}

/**
 * Logger utility for consistent output formatting
 */
const log = {
  info: (message: string) => console.log(`[INFO] ${message}`),
  success: (message: string) => console.log(`[SUCCESS] ${message}`),
  warn: (message: string) => console.log(`[WARN] ${message}`),
  error: (message: string) => console.error(`[ERROR] ${message}`),
  progress: (current: number, total: number, message: string) =>
    console.log(`[PROGRESS] (${current}/${total}) ${message}`),
};

/**
 * Sleep utility for rate limiting
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Get all PDF files from the docs folder
 */
function getPdfFiles(): string[] {
  if (!fs.existsSync(DOCS_FOLDER)) {
    log.warn(`Docs folder does not exist: ${DOCS_FOLDER}`);
    return [];
  }

  const files = fs.readdirSync(DOCS_FOLDER);
  const pdfFiles = files.filter(
    (file) => file.toLowerCase().endsWith(".pdf") && !file.startsWith(".")
  );

  return pdfFiles.map((file) => path.join(DOCS_FOLDER, file));
}

/**
 * Extract text from a PDF file
 * Returns text content and page count
 */
async function extractTextFromPdf(
  filePath: string
): Promise<{ text: string; numPages: number } | null> {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdf(dataBuffer);

    return {
      text: data.text,
      numPages: data.numpages,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    log.error(`Failed to parse PDF ${filePath}: ${errorMessage}`);
    return null;
  }
}

/**
 * Process a single PDF file into chunks
 */
async function processPdf(filePath: string): Promise<ProcessedChunk[]> {
  const fileName = path.basename(filePath);
  log.info(`Processing: ${fileName}`);

  const result = await extractTextFromPdf(filePath);
  if (!result) {
    return [];
  }

  const { text, numPages } = result;
  log.info(`  - Extracted ${text.length} characters from ${numPages} pages`);

  // Split text into chunks
  const chunks = splitTextIntoChunks(text, DEFAULT_CHUNK_CONFIG);
  log.info(`  - Created ${chunks.length} chunks`);

  // Create processed chunks with metadata
  const processedChunks: ProcessedChunk[] = chunks.map((chunk, index) => {
    // Create a unique ID for this chunk
    const id = `${fileName.replace(/[^a-zA-Z0-9]/g, "_")}_chunk_${index}`;

    return {
      id,
      text: chunk.text,
      metadata: {
        source: fileName,
        pageNumber: estimatePageNumber(chunk.startOffset, text.length, numPages),
        chunkIndex: index,
        totalChunks: chunks.length,
        text: chunk.text.substring(0, 1000), // Store first 1000 chars for retrieval
      },
    };
  });

  return processedChunks;
}

/**
 * Estimate which page a chunk is from based on character offset
 * This is an approximation since pdf-parse doesn't provide page boundaries
 */
function estimatePageNumber(
  offset: number,
  totalLength: number,
  numPages: number
): number {
  if (numPages === 1) return 1;
  const charsPerPage = totalLength / numPages;
  return Math.min(Math.floor(offset / charsPerPage) + 1, numPages);
}

/**
 * Generate embeddings for chunks in batches
 */
async function generateEmbeddingsForChunks(
  chunks: ProcessedChunk[]
): Promise<Array<{ id: string; values: number[]; metadata: ChunkMetadata }>> {
  const results: Array<{
    id: string;
    values: number[];
    metadata: ChunkMetadata;
  }> = [];

  log.info(`Generating embeddings for ${chunks.length} chunks...`);
  log.info(`  - Using model: ${EMBEDDING_CONFIG.model}`);
  log.info(`  - Batch size: ${BATCH_SIZE}`);

  for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
    const batch = chunks.slice(i, i + BATCH_SIZE);
    const texts = batch.map((c) => c.text);

    log.progress(
      Math.min(i + BATCH_SIZE, chunks.length),
      chunks.length,
      `Generating embeddings...`
    );

    try {
      const embeddings = await generateEmbeddings(texts);

      for (let j = 0; j < batch.length; j++) {
        results.push({
          id: batch[j].id,
          values: embeddings[j],
          metadata: batch[j].metadata,
        });
      }

      // Small delay between batches to avoid rate limits
      if (i + BATCH_SIZE < chunks.length) {
        await sleep(100);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      log.error(`Failed to generate embeddings for batch: ${errorMessage}`);

      // If rate limited, wait and retry
      if (errorMessage.includes("rate") || errorMessage.includes("429")) {
        log.warn("Rate limited, waiting 60 seconds...");
        await sleep(60000);
        i -= BATCH_SIZE; // Retry this batch
      }
    }
  }

  return results;
}

/**
 * Upsert vectors to Pinecone in batches
 */
async function upsertVectorsToPinecone(
  vectors: Array<{ id: string; values: number[]; metadata: ChunkMetadata }>
): Promise<void> {
  log.info(`Upserting ${vectors.length} vectors to Pinecone...`);

  for (let i = 0; i < vectors.length; i += UPSERT_BATCH_SIZE) {
    const batch = vectors.slice(i, i + UPSERT_BATCH_SIZE);

    log.progress(
      Math.min(i + UPSERT_BATCH_SIZE, vectors.length),
      vectors.length,
      `Upserting vectors...`
    );

    try {
      await upsertToPinecone(batch);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      log.error(`Failed to upsert batch: ${errorMessage}`);
      throw error;
    }
  }
}

/**
 * Main ingestion function
 */
async function main(): Promise<void> {
  console.log("\n========================================");
  console.log("  Vitasigns Training Bot - PDF Ingestion");
  console.log("========================================\n");

  // Validate environment variables
  const requiredEnvVars = [
    "OPENAI_API_KEY",
    "PINECONE_API_KEY",
    "PINECONE_INDEX_NAME",
  ];
  const missingEnvVars = requiredEnvVars.filter(
    (varName) => !process.env[varName]
  );

  if (missingEnvVars.length > 0) {
    log.error(`Missing environment variables: ${missingEnvVars.join(", ")}`);
    log.error("Please ensure these are set in your .env.local file");
    process.exit(1);
  }

  // Get PDF files
  const pdfFiles = getPdfFiles();

  if (pdfFiles.length === 0) {
    log.warn("No PDF files found in the docs folder.");
    log.info(`Please add PDF files to: ${DOCS_FOLDER}`);
    console.log("\nIngestion complete (no files to process).\n");
    return;
  }

  log.info(`Found ${pdfFiles.length} PDF file(s) to process`);
  pdfFiles.forEach((file) => log.info(`  - ${path.basename(file)}`));
  console.log("");

  // Process all PDFs
  const allChunks: ProcessedChunk[] = [];

  for (let i = 0; i < pdfFiles.length; i++) {
    log.progress(i + 1, pdfFiles.length, `Processing PDFs...`);
    const chunks = await processPdf(pdfFiles[i]);
    allChunks.push(...chunks);
    console.log("");
  }

  if (allChunks.length === 0) {
    log.warn("No chunks were created from the PDFs.");
    console.log("\nIngestion complete (no content to index).\n");
    return;
  }

  log.success(`Total chunks created: ${allChunks.length}`);
  console.log("");

  // Generate embeddings
  const vectors = await generateEmbeddingsForChunks(allChunks);

  if (vectors.length === 0) {
    log.error("No embeddings were generated.");
    process.exit(1);
  }

  log.success(`Generated ${vectors.length} embeddings`);
  console.log("");

  // Upsert to Pinecone
  await upsertVectorsToPinecone(vectors);

  log.success(`Upserted ${vectors.length} vectors to Pinecone`);

  // Summary
  console.log("\n========================================");
  console.log("  Ingestion Summary");
  console.log("========================================");
  console.log(`  PDFs processed: ${pdfFiles.length}`);
  console.log(`  Chunks created: ${allChunks.length}`);
  console.log(`  Vectors stored: ${vectors.length}`);
  console.log(`  Pinecone index: ${process.env.PINECONE_INDEX_NAME}`);
  console.log("========================================\n");

  log.success("Ingestion complete!");
}

// Run the ingestion
main().catch((error) => {
  log.error(`Ingestion failed: ${error.message}`);
  console.error(error);
  process.exit(1);
});
