"use client";

import { cn } from "@/lib/utils";
import { Message as MessageType } from "@/lib/types";
import { User, Bot, Loader2 } from "lucide-react";
import { Citation, parseCitationReferences, CitationBadge } from "./Citation";

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
          // Handle headers (# ## ### etc.)
          const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);
          if (headerMatch) {
            const level = headerMatch[1].length;
            const headerText = headerMatch[2];
            const headerClasses = {
              1: "text-xl font-bold mt-4 mb-2",
              2: "text-lg font-bold mt-3 mb-2",
              3: "text-base font-semibold mt-3 mb-1",
              4: "text-sm font-semibold mt-2 mb-1",
              5: "text-sm font-medium mt-2 mb-1",
              6: "text-sm font-medium mt-2 mb-1",
            }[level] || "font-semibold";

            return (
              <span key={lineIndex} className={`block ${headerClasses}`}>
                {formatInlineText(headerText)}
              </span>
            );
          }

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
 * Formats inline text with bold, inline code, and citation reference support
 */
function formatInlineText(text: string): React.ReactNode {
  // Handle bold text (**text**), inline code (`code`), and source references ([Source N])
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\[Source\s+\d+[^\]]*\])/gi);

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
    // Handle source references like [Source 1] or [Source 1: Title]
    const sourceMatch = part.match(/^\[Source\s+(\d+)[^\]]*\]$/i);
    if (sourceMatch) {
      const sourceNum = parseInt(sourceMatch[1], 10);
      return <CitationBadge key={index} sourceNumber={sourceNum} />;
    }
    return part;
  });
}

export function Message({ message }: MessageProps) {
  const isUser = message.role === "user";
  const isLoading = message.isLoading;

  // Check if this assistant message contains source references and extract them
  const { hasSourceReferences, sources: extractedSources } = !isUser && !isLoading && message.content
    ? parseCitationReferences(message.content)
    : { hasSourceReferences: false, sources: [] };

  // Use message sources if available, otherwise use extracted sources from content
  const sourcesToShow = message.sources?.length ? message.sources : extractedSources;

  // Show citations if we have sources to display
  const showCitations = !isUser && !isLoading && hasSourceReferences && sourcesToShow.length > 0;

  return (
    <div
      className={cn(
        "flex w-full gap-3 px-4 py-4 animate-fade-in",
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
      <div className="flex max-w-[80%] flex-col">
        <div
          className={cn(
            "flex flex-col gap-1 rounded-2xl px-4 py-3",
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

        {/* Citations section for assistant messages */}
        {showCitations && (
          <Citation sources={sourcesToShow} />
        )}
      </div>
    </div>
  );
}
