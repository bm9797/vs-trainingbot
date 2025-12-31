/**
 * Chat storage utilities for localStorage persistence
 */

import { Message } from "@/lib/types";

const STORAGE_KEY = "vitasigns_chat_sessions";
const MAX_TITLE_LENGTH = 50;

/**
 * Represents a chat session stored in localStorage
 */
export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Serialized version of ChatSession for localStorage
 * Messages with Date objects are converted to ISO strings
 */
interface StoredChatSession {
  id: string;
  title: string;
  messages: Array<{
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: string;
    isLoading?: boolean;
  }>;
  createdAt: string;
  updatedAt: string;
}

/**
 * Generate a unique ID for chat sessions
 */
export function generateChatId(): string {
  return `chat_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Generate a chat title from the first user message
 * Truncates to MAX_TITLE_LENGTH characters
 */
export function generateChatTitle(messages: Message[]): string {
  const firstUserMessage = messages.find((msg) => msg.role === "user");

  if (!firstUserMessage) {
    return "New Chat";
  }

  const content = firstUserMessage.content.trim();

  if (content.length <= MAX_TITLE_LENGTH) {
    return content;
  }

  // Truncate at word boundary if possible
  const truncated = content.substring(0, MAX_TITLE_LENGTH);
  const lastSpace = truncated.lastIndexOf(" ");

  if (lastSpace > MAX_TITLE_LENGTH * 0.6) {
    return truncated.substring(0, lastSpace) + "...";
  }

  return truncated + "...";
}

/**
 * Check if localStorage is available
 */
function isLocalStorageAvailable(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    const testKey = "__storage_test__";
    window.localStorage.setItem(testKey, testKey);
    window.localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get all stored sessions from localStorage
 */
function getStoredSessions(): StoredChatSession[] {
  if (!isLocalStorageAvailable()) {
    return [];
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return [];
    }
    return JSON.parse(stored) as StoredChatSession[];
  } catch (error) {
    console.error("Error reading chat sessions from localStorage:", error);
    return [];
  }
}

/**
 * Save sessions to localStorage
 */
function setStoredSessions(sessions: StoredChatSession[]): void {
  if (!isLocalStorageAvailable()) {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch (error) {
    console.error("Error saving chat sessions to localStorage:", error);
  }
}

/**
 * Convert a ChatSession to StoredChatSession for localStorage
 */
function toStoredSession(session: ChatSession): StoredChatSession {
  return {
    ...session,
    messages: session.messages.map((msg) => ({
      ...msg,
      timestamp:
        msg.timestamp instanceof Date
          ? msg.timestamp.toISOString()
          : msg.timestamp,
    })),
  };
}

/**
 * Convert a StoredChatSession to ChatSession
 */
function fromStoredSession(stored: StoredChatSession): ChatSession {
  return {
    ...stored,
    messages: stored.messages.map((msg) => ({
      ...msg,
      timestamp: new Date(msg.timestamp),
    })),
  };
}

/**
 * Save or update a chat session
 */
export function saveChatSession(session: ChatSession): void {
  const sessions = getStoredSessions();
  const existingIndex = sessions.findIndex((s) => s.id === session.id);

  const storedSession = toStoredSession({
    ...session,
    updatedAt: new Date().toISOString(),
  });

  if (existingIndex >= 0) {
    sessions[existingIndex] = storedSession;
  } else {
    sessions.unshift(storedSession);
  }

  setStoredSessions(sessions);
}

/**
 * Get a single chat session by ID
 */
export function getChatSession(id: string): ChatSession | null {
  const sessions = getStoredSessions();
  const stored = sessions.find((s) => s.id === id);

  if (!stored) {
    return null;
  }

  return fromStoredSession(stored);
}

/**
 * Get all chat sessions sorted by updatedAt (most recent first)
 */
export function getAllChatSessions(): ChatSession[] {
  const sessions = getStoredSessions();

  return sessions
    .map(fromStoredSession)
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
}

/**
 * Delete a chat session by ID
 */
export function deleteChatSession(id: string): void {
  const sessions = getStoredSessions();
  const filtered = sessions.filter((s) => s.id !== id);
  setStoredSessions(filtered);
}

/**
 * Create a new chat session with initial values
 */
export function createChatSession(messages: Message[] = []): ChatSession {
  const now = new Date().toISOString();

  return {
    id: generateChatId(),
    title: messages.length > 0 ? generateChatTitle(messages) : "New Chat",
    messages,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Format a relative timestamp (e.g., "2 hours ago", "yesterday")
 */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return "just now";
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return diffInMinutes === 1 ? "1 minute ago" : `${diffInMinutes} minutes ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return diffInHours === 1 ? "1 hour ago" : `${diffInHours} hours ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) {
    return "yesterday";
  }
  if (diffInDays < 7) {
    return `${diffInDays} days ago`;
  }

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return diffInWeeks === 1 ? "1 week ago" : `${diffInWeeks} weeks ago`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return diffInMonths === 1 ? "1 month ago" : `${diffInMonths} months ago`;
  }

  const diffInYears = Math.floor(diffInDays / 365);
  return diffInYears === 1 ? "1 year ago" : `${diffInYears} years ago`;
}
