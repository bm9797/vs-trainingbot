"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ChatSession,
  formatRelativeTime,
  deleteChatSession,
} from "@/lib/chatStorage";
import {
  MessageSquarePlus,
  MessageSquare,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface SidebarProps {
  sessions: ChatSession[];
  currentSessionId: string | null;
  onSelectSession: (session: ChatSession) => void;
  onNewChat: () => void;
  onDeleteSession: (sessionId: string) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  className?: string;
}

export function Sidebar({
  sessions,
  currentSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  isCollapsed = false,
  onToggleCollapse,
  className,
}: SidebarProps) {
  const [hoveredSessionId, setHoveredSessionId] = useState<string | null>(null);

  const handleDelete = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    deleteChatSession(sessionId);
    onDeleteSession(sessionId);
  };

  if (isCollapsed) {
    return (
      <div
        className={cn(
          "flex h-full w-12 flex-col border-r bg-sidebar transition-all duration-300",
          className
        )}
      >
        <div className="flex h-14 items-center justify-center border-b">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleCollapse}
            className="h-8 w-8"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex flex-col items-center gap-2 p-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onNewChat}
            className="h-8 w-8"
            title="New Chat"
          >
            <MessageSquarePlus className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex h-full w-64 flex-col border-r bg-sidebar transition-all duration-300",
        className
      )}
    >
      {/* Header */}
      <div className="flex h-14 items-center justify-between border-b px-3">
        <span className="font-semibold text-sidebar-foreground">Chats</span>
        {onToggleCollapse && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleCollapse}
            className="h-8 w-8"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* New Chat Button */}
      <div className="p-3">
        <Button
          onClick={onNewChat}
          variant="outline"
          className="w-full justify-start gap-2"
        >
          <MessageSquarePlus className="h-4 w-4" />
          New Chat
        </Button>
      </div>

      {/* Chat List */}
      <ScrollArea className="flex-1 px-2">
        <div className="flex flex-col gap-1 pb-4">
          {sessions.length === 0 ? (
            <div className="px-3 py-8 text-center text-sm text-muted-foreground">
              No chat history yet.
              <br />
              Start a new conversation!
            </div>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                className={cn(
                  "group relative flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors",
                  currentSessionId === session.id
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                )}
                onClick={() => onSelectSession(session)}
                onMouseEnter={() => setHoveredSessionId(session.id)}
                onMouseLeave={() => setHoveredSessionId(null)}
              >
                <MessageSquare className="h-4 w-4 shrink-0" />
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate font-medium">{session.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatRelativeTime(session.updatedAt)}
                  </span>
                </div>
                {(hoveredSessionId === session.id ||
                  currentSessionId === session.id) && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                    onClick={(e) => handleDelete(e, session.id)}
                    title="Delete chat"
                  >
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                )}
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

/**
 * Mobile-specific sidebar content for use within Sheet component
 */
interface MobileSidebarContentProps {
  sessions: ChatSession[];
  currentSessionId: string | null;
  onSelectSession: (session: ChatSession) => void;
  onNewChat: () => void;
  onDeleteSession: (sessionId: string) => void;
}

export function MobileSidebarContent({
  sessions,
  currentSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
}: MobileSidebarContentProps) {
  const handleDelete = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    deleteChatSession(sessionId);
    onDeleteSession(sessionId);
  };

  return (
    <div className="flex h-full flex-col">
      {/* New Chat Button */}
      <div className="border-b p-4">
        <Button
          onClick={onNewChat}
          variant="outline"
          className="w-full justify-start gap-2"
        >
          <MessageSquarePlus className="h-4 w-4" />
          New Chat
        </Button>
      </div>

      {/* Chat List */}
      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-1 p-2">
          {sessions.length === 0 ? (
            <div className="px-3 py-8 text-center text-sm text-muted-foreground">
              No chat history yet.
              <br />
              Start a new conversation!
            </div>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                className={cn(
                  "group relative flex cursor-pointer items-center gap-2 rounded-md px-3 py-3 text-sm transition-colors",
                  currentSessionId === session.id
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-accent/50"
                )}
                onClick={() => onSelectSession(session)}
              >
                <MessageSquare className="h-4 w-4 shrink-0" />
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate font-medium">{session.title}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatRelativeTime(session.updatedAt)}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={(e) => handleDelete(e, session.id)}
                  title="Delete chat"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
