"use client";

import { cn } from "@/lib/utils";
import { Message as MessageType } from "@/lib/types";
import { User, Bot, Loader2 } from "lucide-react";

interface MessageProps {
  message: MessageType;
}

/**
 * Renders markdown-like content with basic formatting support
 * Supports: bold (**text**), bullet points, numbered lists, and code blocks
 */
function renderContent(content: string): React.ReactNode {
  // Split content by code blocks first
  const parts = content.split(/(```[\s\S]*?```)/g);

  return parts.map((part, index) => {
    // Handle code blocks
    if (part.startsWith("```") && part.endsWith("```")) {
      const code = part.slice(3, -3);
      const lines = code.split("\n");
      // First line might be the language
      const firstLine = lines[0];
      const isLanguage = firstLine && !firstLine.includes(" ") && firstLine.length < 20;
      const codeContent = isLanguage ? lines.slice(1).join("\n") : code;

      return (
        <pre
          key={index}
          className="my-2 overflow-x-auto rounded-md bg-muted p-3 text-sm"
        >
          <code>{codeContent.trim()}</code>
        </pre>
      );
    }

    // Handle regular text with inline formatting
    return (
      <span key={index}>
        {part.split("\n").map((line, lineIndex, arr) => {
          // Handle bullet points
          if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
            const bulletContent = line.trim().slice(2);
            return (
              <span key={lineIndex} className="block pl-4">
                <span className="mr-2">&#x2022;</span>
                {formatInlineText(bulletContent)}
              </span>
            );
          }

          // Handle numbered lists
          const numberedMatch = line.trim().match(/^(\d+)\.\s(.+)$/);
          if (numberedMatch) {
            return (
              <span key={lineIndex} className="block pl-4">
                <span className="mr-2">{numberedMatch[1]}.</span>
                {formatInlineText(numberedMatch[2])}
              </span>
            );
          }

          // Regular line
          return (
            <span key={lineIndex}>
              {formatInlineText(line)}
              {lineIndex < arr.length - 1 && <br />}
            </span>
          );
        })}
      </span>
    );
  });
}

/**
 * Formats inline text with bold and inline code support
 */
function formatInlineText(text: string): React.ReactNode {
  // Handle bold text (**text**) and inline code (`code`)
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);

  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={index} className="font-semibold">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={index}
          className="rounded bg-muted px-1.5 py-0.5 text-sm font-mono"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

export function Message({ message }: MessageProps) {
  const isUser = message.role === "user";
  const isLoading = message.isLoading;

  return (
    <div
      className={cn(
        "flex w-full gap-3 px-4 py-4",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          isUser ? "bg-primary text-primary-foreground" : "bg-muted"
        )}
      >
        {isUser ? (
          <User className="h-4 w-4" />
        ) : (
          <Bot className="h-4 w-4" />
        )}
      </div>

      {/* Message Content */}
      <div
        className={cn(
          "flex max-w-[80%] flex-col gap-1 rounded-2xl px-4 py-3",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-foreground"
        )}
      >
        {isLoading ? (
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Thinking...</span>
          </div>
        ) : (
          <div className="text-sm leading-relaxed whitespace-pre-wrap">
            {isUser ? message.content : renderContent(message.content)}
          </div>
        )}
      </div>
    </div>
  );
}
