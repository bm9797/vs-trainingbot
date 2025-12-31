/**
 * Message types for the chat interface
 * Compatible with Vercel AI SDK's message format
 */

export type MessageRole = "user" | "assistant" | "system";

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp?: Date;
  createdAt?: Date;
  isLoading?: boolean;
}

/**
 * Convert Vercel AI SDK message to our Message format
 * The AI SDK uses 'createdAt' while our format uses 'timestamp'
 */
export function convertAIMessage(aiMessage: {
  id: string;
  role: string;
  content: string;
  createdAt?: Date;
}): Message {
  return {
    id: aiMessage.id,
    role: aiMessage.role as MessageRole,
    content: aiMessage.content,
    timestamp: aiMessage.createdAt || new Date(),
    createdAt: aiMessage.createdAt,
  };
}

/**
 * Generate a unique ID for messages
 */
export function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Create a new user message
 */
export function createUserMessage(content: string): Message {
  return {
    id: generateMessageId(),
    role: "user",
    content,
    timestamp: new Date(),
  };
}

/**
 * Create a new assistant message
 */
export function createAssistantMessage(
  content: string,
  isLoading = false
): Message {
  return {
    id: generateMessageId(),
    role: "assistant",
    content,
    timestamp: new Date(),
    isLoading,
  };
}
