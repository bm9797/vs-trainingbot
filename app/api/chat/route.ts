/**
 * Chat API Route with RAG-powered streaming responses
 *
 * This endpoint:
 * 1. Accepts a messages array from the client
 * 2. Retrieves relevant context from Pinecone based on the latest user query
 * 3. Streams a response from OpenAI using the Vercel AI SDK
 * 4. Includes source citations in the response metadata
 */

import { openai } from "@ai-sdk/openai";
import { streamText, createUIMessageStream, createUIMessageStreamResponse, generateId } from "ai";
import { SYSTEM_PROMPT, MODEL_CONFIG } from "@/lib/constants";
import { getRAGContext } from "@/lib/rag";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

/**
 * Message format from client
 */
interface ClientMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
}

/**
 * Build the complete system prompt with RAG context
 */
function buildSystemPrompt(contextSection: string): string {
  return `${SYSTEM_PROMPT}

${contextSection}`;
}

/**
 * POST handler for chat requests
 * Uses Vercel AI SDK for streaming responses with RAG context
 */
export async function POST(req: Request) {
  try {
    const { messages } = (await req.json()) as { messages: ClientMessage[] };

    // Validate request
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "Messages array is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Extract the latest user message for RAG context retrieval
    const latestUserMessage = [...messages]
      .reverse()
      .find((msg) => msg.role === "user");

    if (!latestUserMessage || !latestUserMessage.content) {
      return new Response(
        JSON.stringify({ error: "No valid user message found" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Retrieve RAG context based on the user's question
    const { contextSection, sources, chunks } = await getRAGContext(
      latestUserMessage.content
    );

    // Build the complete system prompt with context
    const systemPrompt = buildSystemPrompt(contextSection);

    // Convert client messages to model messages format
    const modelMessages = messages.map((msg) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    }));

    // Create the UI message stream for proper integration with useChat
    const stream = createUIMessageStream({
      execute: async ({ writer }) => {
        // Generate a unique ID for the text part
        const textPartId = generateId();

        try {
          // Signal start of text
          writer.write({ type: "text-start", id: textPartId });

          console.log("[Chat API] Starting stream with model:", MODEL_CONFIG.model);

          const result = streamText({
            model: openai(MODEL_CONFIG.model),
            system: systemPrompt,
            messages: modelMessages,
            temperature: MODEL_CONFIG.temperature,
            maxOutputTokens: MODEL_CONFIG.maxOutputTokens,
            onFinish: async ({ usage }) => {
              // Log usage for monitoring
              console.log("[Chat API] Response completed", {
                inputTokens: usage?.inputTokens,
                outputTokens: usage?.outputTokens,
                totalTokens: (usage?.inputTokens || 0) + (usage?.outputTokens || 0),
                sourcesUsed: sources.length,
                chunksRetrieved: chunks.length,
              });
            },
          });

          // Consume the stream and write deltas
          for await (const chunk of result.textStream) {
            writer.write({ type: "text-delta", delta: chunk, id: textPartId });
          }

          // Signal end of text
          writer.write({ type: "text-end", id: textPartId });
        } catch (streamError) {
          console.error("[Chat API] Error during streaming:", streamError);
          // Write error message to stream so user sees something
          writer.write({
            type: "text-delta",
            delta: "I'm having trouble generating a response right now. Please try again in a moment.",
            id: textPartId
          });
          writer.write({ type: "text-end", id: textPartId });
        }
      },
      onError: (error) => {
        console.error("[Chat API] Stream error:", error);
        return "An error occurred while generating the response.";
      },
    });

    return createUIMessageStreamResponse({
      stream,
    });
  } catch (error) {
    console.error("[Chat API] Error:", error);

    // Handle specific error types
    if (error instanceof Error) {
      // Check for API key errors
      if (
        error.message.includes("API key") ||
        error.message.includes("OPENAI_API_KEY")
      ) {
        return new Response(
          JSON.stringify({
            error: "API configuration error. Please check server configuration.",
          }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }

      // Check for Pinecone errors
      if (
        error.message.includes("PINECONE") ||
        error.message.includes("Pinecone")
      ) {
        return new Response(
          JSON.stringify({
            error: "Knowledge base temporarily unavailable. Please try again.",
          }),
          { status: 503, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // Generic error response
    return new Response(
      JSON.stringify({
        error: "An unexpected error occurred. Please try again.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
