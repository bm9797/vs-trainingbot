"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ChatSession,
  formatRelativeTime,
  deleteChatSession,
} from "@/lib/chatStorage";
import {
  MessageSquarePlus,
  MessageSquare,
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

// Reusable delete confirmation dialog
interface DeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
}

function DeleteConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
}: DeleteDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Individual chat item component
interface ChatItemProps {
  session: ChatSession;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
}

function ChatItem({ session, isActive, onSelect, onDelete }: ChatItemProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  return (
    <>
      <div
        className={cn(
          "group relative flex cursor-pointer items-center gap-2 rounded-md px-3 py-2.5 text-sm transition-colors",
          isActive
            ? "bg-sidebar-accent text-sidebar-accent-foreground"
            : "text-sidebar-foreground hover:bg-sidebar-accent/50"
        )}
        onClick={onSelect}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSelect();
          }
        }}
      >
        {/* Chat icon */}
        <MessageSquare className="h-4 w-4 shrink-0 text-muted-foreground" />

        {/* Title and timestamp */}
        <div className="min-w-0 flex-1">
          <div className="truncate font-medium">{session.title}</div>
          <div className="text-xs text-muted-foreground">
            {formatRelativeTime(session.updatedAt)}
          </div>
        </div>

        {/* Delete button - text link style */}
        <button
          type="button"
          className="shrink-0 rounded px-2 py-1 text-xs font-medium text-red-500 hover:bg-red-50 hover:text-red-700"
          onClick={(e) => {
            e.stopPropagation();
            setShowDeleteDialog(true);
          }}
        >
          Delete
        </button>
      </div>

      <DeleteConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={onDelete}
        title="Delete chat?"
        description="This conversation will be permanently deleted. This action cannot be undone."
      />
    </>
  );
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
  const [showClearAllDialog, setShowClearAllDialog] = useState(false);

  const handleDeleteSession = (sessionId: string) => {
    deleteChatSession(sessionId);
    onDeleteSession(sessionId);
  };

  const handleClearAll = () => {
    sessions.forEach((s) => {
      deleteChatSession(s.id);
      onDeleteSession(s.id);
    });
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
              <ChatItem
                key={session.id}
                session={session}
                isActive={currentSessionId === session.id}
                onSelect={() => onSelectSession(session)}
                onDelete={() => handleDeleteSession(session.id)}
              />
            ))
          )}
        </div>
      </ScrollArea>

      {/* Clear All - Footer link style */}
      {sessions.length > 0 && (
        <div className="border-t px-3 py-2">
          <button
            type="button"
            className="w-full text-center text-xs text-muted-foreground hover:text-destructive transition-colors"
            onClick={() => setShowClearAllDialog(true)}
          >
            Clear all chats
          </button>
        </div>
      )}

      {/* Clear All Confirmation Dialog */}
      <DeleteConfirmDialog
        isOpen={showClearAllDialog}
        onClose={() => setShowClearAllDialog(false)}
        onConfirm={handleClearAll}
        title="Clear all chats?"
        description={`This will permanently delete ${sessions.length} conversation${sessions.length === 1 ? "" : "s"}. This action cannot be undone.`}
      />
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
  const [showClearAllDialog, setShowClearAllDialog] = useState(false);

  const handleDeleteSession = (sessionId: string) => {
    deleteChatSession(sessionId);
    onDeleteSession(sessionId);
  };

  const handleClearAll = () => {
    sessions.forEach((s) => {
      deleteChatSession(s.id);
      onDeleteSession(s.id);
    });
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
              <ChatItem
                key={session.id}
                session={session}
                isActive={currentSessionId === session.id}
                onSelect={() => onSelectSession(session)}
                onDelete={() => handleDeleteSession(session.id)}
              />
            ))
          )}
        </div>
      </ScrollArea>

      {/* Clear All - Footer link style */}
      {sessions.length > 0 && (
        <div className="border-t px-4 py-3">
          <button
            type="button"
            className="w-full text-center text-sm text-muted-foreground hover:text-destructive transition-colors"
            onClick={() => setShowClearAllDialog(true)}
          >
            Clear all chats
          </button>
        </div>
      )}

      {/* Clear All Confirmation Dialog */}
      <DeleteConfirmDialog
        isOpen={showClearAllDialog}
        onClose={() => setShowClearAllDialog(false)}
        onConfirm={handleClearAll}
        title="Clear all chats?"
        description={`This will permanently delete ${sessions.length} conversation${sessions.length === 1 ? "" : "s"}. This action cannot be undone.`}
      />
    </div>
  );
}
