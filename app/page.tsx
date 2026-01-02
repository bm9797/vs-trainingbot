"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useChat } from "@ai-sdk/react";
import { type UIMessage, DefaultChatTransport } from "ai";
import { MessageList, ChatInput, EmptyState } from "@/components/chat";
import { ChatSkeleton } from "@/components/chat/ChatSkeleton";
import { ChatLayout } from "@/components/chat/ChatLayout";
import { Message } from "@/lib/types";
import {
  ChatSession,
  createChatSession,
  getAllChatSessions,
} from "@/lib/chatStorage";

/**
 * Helper to extract text content from UIMessage parts
 */
function getTextFromParts(parts: UIMessage["parts"]): string {
  // Handle various part formats from AI SDK
  const textContent = parts
    .map((part) => {
      // Standard text part
      if (part.type === "text" && "text" in part) {
        return part.text;
      }
      // Text part with content field
      if ("content" in part && typeof part.content === "string") {
        return part.content;
      }
      return "";
    })
    .join("");

  return textContent;
}

/**
 * Convert UIMessage to our Message format for display
 */
function convertToDisplayMessage(
  msg: UIMessage,
  isStreaming = false
): Message {
  const content = getTextFromParts(msg.parts);
  return {
    id: msg.id,
    role: msg.role as "user" | "assistant",
    content,
    timestamp: new Date(),
    isLoading: msg.role === "assistant" && isStreaming && content === "",
  };
}

/**
 * Convert stored messages to UIMessage format for useChat
 */
function convertToUIMessages(messages: Message[]): UIMessage[] {
  return messages.map((msg) => ({
    id: msg.id,
    role: msg.role as "user" | "assistant",
    parts: [{ type: "text" as const, text: msg.content }],
  }));
}

/**
 * Stable initial session for SSR hydration
 * Uses fixed values to avoid hydration mismatch
 */
const INITIAL_SESSION: ChatSession = {
  id: "initial_session",
  title: "New Chat",
  messages: [],
  createdAt: "1970-01-01T00:00:00.000Z",
  updatedAt: "1970-01-01T00:00:00.000Z",
};

export default function Home() {
  const [error, setError] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [currentSession, setCurrentSession] = useState<ChatSession>(INITIAL_SESSION);
  const initialLoadDone = useRef(false);

  // Load session from localStorage after hydration
  // This is a legitimate use of setState in useEffect for client-only data
  useEffect(() => {
    if (initialLoadDone.current) return;
    initialLoadDone.current = true;

    const sessions = getAllChatSessions();
    if (sessions.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCurrentSession(sessions[0]);
    } else {
      setCurrentSession(createChatSession([]));
    }
    setIsHydrated(true);
  }, []);

  // Create the transport with custom body transformation
  const transport = useMemo(() => {
    return new DefaultChatTransport({
      api: "/api/chat",
      // Transform the messages to our expected format
      prepareSendMessagesRequest: async ({ messages }) => {
        return {
          body: {
            messages: messages.map((msg) => ({
              id: msg.id,
              role: msg.role,
              content: getTextFromParts(msg.parts),
            })),
          },
        };
      },
    });
  }, []);

  // Use the Vercel AI SDK useChat hook for streaming responses
  const chatHelpers = useChat({
    id: currentSession.id,
    transport,
    onError: (err) => {
      console.error("[Chat] Error:", err);
      setError(err.message || "An error occurred. Please try again.");
    },
    onFinish: (message) => {
      console.log("[Chat] Finished, message:", message);
      console.log("[Chat] Message parts:", message.parts);
      setError(null);
    },
  });

  const { messages, status, sendMessage, setMessages } = chatHelpers;

  // Sync messages when hydration completes and session has messages
  const messagesInitialized = useRef(false);
  useEffect(() => {
    if (isHydrated && !messagesInitialized.current && currentSession.messages.length > 0) {
      messagesInitialized.current = true;
      setMessages(convertToUIMessages(currentSession.messages));
    }
  }, [isHydrated, currentSession.messages, setMessages]);

  const isLoading = status === "streaming" || status === "submitted";

  // Clear error after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Convert AI SDK messages to our Message format for display
  const displayMessages: Message[] = messages.map((msg) =>
    convertToDisplayMessage(msg, isLoading)
  );

  // Add a loading placeholder if we're waiting for the first response
  const messagesWithLoading =
    isLoading &&
    (displayMessages.length === 0 ||
      displayMessages[displayMessages.length - 1]?.role === "user")
      ? [
          ...displayMessages,
          {
            id: "loading",
            role: "assistant" as const,
            content: "",
            isLoading: true,
          },
        ]
      : displayMessages;

  const handleSendMessage = useCallback(
    async (content: string) => {
      setError(null);
      try {
        await sendMessage({ text: content });
      } catch (err) {
        console.error("[Chat] Send error:", err);
        setError(
          err instanceof Error ? err.message : "Failed to send message"
        );
      }
    },
    [sendMessage]
  );

  const handleSelectQuestion = useCallback(
    (question: string) => {
      handleSendMessage(question);
    },
    [handleSendMessage]
  );

  const handleSessionChange = useCallback(
    (session: ChatSession | null) => {
      if (session) {
        setCurrentSession(session);
        // Convert session messages to AI SDK format
        setMessages(convertToUIMessages(session.messages));
      }
    },
    [setMessages]
  );

  const handleNewChat = useCallback(() => {
    const newSession = createChatSession([]);
    setCurrentSession(newSession);
    setMessages([]);
    setError(null);
  }, [setMessages]);

  const hasMessages = messagesWithLoading.length > 0;

  // Show skeleton during initial hydration
  if (!isHydrated) {
    return <ChatSkeleton />;
  }

  return (
    <ChatLayout
      messages={displayMessages}
      currentSession={currentSession}
      onSessionChange={handleSessionChange}
      onNewChat={handleNewChat}
    >
      {/* Error Banner */}
      {error && (
        <div className="mx-4 mt-2 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <span className="font-medium">Error: </span>
          {error}
        </div>
      )}

      {/* Main Chat Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {hasMessages ? (
          <MessageList messages={messagesWithLoading} />
        ) : (
          <EmptyState onSelectQuestion={handleSelectQuestion} />
        )}
      </div>

      {/* Chat Input - Fixed at bottom */}
      <div className="sticky bottom-0 w-full">
        <ChatInput onSend={handleSendMessage} isDisabled={isLoading} />
      </div>
    </ChatLayout>
  );
}
