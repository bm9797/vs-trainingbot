"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp, FileText, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Source information for citations
 */
export interface CitationSource {
  source: string;
  title?: string;
  category?: string;
}

interface CitationProps {
  sources: CitationSource[];
  className?: string;
}

/**
 * Individual citation item component
 */
function CitationItem({ source, index }: { source: CitationSource; index: number }) {
  return (
    <div className="flex items-start gap-2 rounded-md bg-muted/50 px-3 py-2">
      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-primary/10 text-xs font-medium text-primary">
        {index + 1}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <FileText className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <span className="text-sm font-medium truncate">
            {source.title || source.source}
          </span>
        </div>
        {source.category && (
          <span className="mt-0.5 inline-block text-xs text-muted-foreground">
            {source.category}
          </span>
        )}
        {source.title && source.source !== source.title && (
          <span className="mt-0.5 block text-xs text-muted-foreground truncate">
            {source.source}
          </span>
        )}
      </div>
    </div>
  );
}

/**
 * Citation component for displaying source documents
 * Shows a collapsible list of sources referenced in assistant responses
 */
export function Citation({ sources, className }: CitationProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!sources || sources.length === 0) {
    return null;
  }

  // Remove duplicate sources based on the source path
  const uniqueSources = sources.reduce<CitationSource[]>((acc, curr) => {
    if (!acc.find((s) => s.source === curr.source)) {
      acc.push(curr);
    }
    return acc;
  }, []);

  return (
    <div className={cn("mt-2", className)}>
      <Button
        variant="ghost"
        size="sm"
        className="h-7 gap-1.5 px-2 text-xs text-muted-foreground hover:text-foreground"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <ExternalLink className="h-3.5 w-3.5" />
        <span>
          {uniqueSources.length} source{uniqueSources.length !== 1 ? "s" : ""}
        </span>
        {isExpanded ? (
          <ChevronUp className="h-3.5 w-3.5" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5" />
        )}
      </Button>

      {isExpanded && (
        <div className="mt-2 space-y-1.5 rounded-lg border bg-background p-2 animate-slide-down">
          <div className="text-xs font-medium text-muted-foreground px-1 pb-1">
            Sources referenced in this response:
          </div>
          {uniqueSources.map((source, index) => (
            <CitationItem key={source.source} source={source} index={index} />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Inline citation badge for showing source numbers in text
 */
export function CitationBadge({ sourceNumber }: { sourceNumber: number }) {
  return (
    <span className="mx-0.5 inline-flex h-4 w-4 items-center justify-center rounded bg-primary/10 text-[10px] font-medium text-primary align-super">
      {sourceNumber}
    </span>
  );
}

/**
 * Parse citation references from message content
 * Extracts [Source N] or [Source N: Title] patterns and returns parsed information
 */
export function parseCitationReferences(content: string): {
  sourceNumbers: number[];
  hasSourceReferences: boolean;
  sources: CitationSource[];
} {
  // Match both [Source N] and [Source N: Title] patterns
  const sourcePattern = /\[Source\s+(\d+)(?::\s*([^\]]+))?\]/gi;
  const matches = content.matchAll(sourcePattern);
  const sourceNumbers: number[] = [];
  const sourcesMap = new Map<number, CitationSource>();

  for (const match of matches) {
    const num = parseInt(match[1], 10);
    const title = match[2]?.trim();

    if (!sourceNumbers.includes(num)) {
      sourceNumbers.push(num);
    }

    // Store the source with the most complete information
    if (!sourcesMap.has(num) || (title && !sourcesMap.get(num)?.title)) {
      sourcesMap.set(num, {
        source: `Source ${num}`,
        title: title || `Source ${num}`,
      });
    }
  }

  // Convert map to array, sorted by source number
  const sources = Array.from(sourcesMap.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([, source]) => source);

  return {
    sourceNumbers: sourceNumbers.sort((a, b) => a - b),
    hasSourceReferences: sourceNumbers.length > 0,
    sources,
  };
}
