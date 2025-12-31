"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Sidebar, MobileSidebarContent } from "@/components/chat/Sidebar";
import {
  ChatSession,
  getAllChatSessions,
  saveChatSession,
  generateChatTitle,
} from "@/lib/chatStorage";
import { Message } from "@/lib/types";
import { Menu } from "lucide-react";

interface ChatLayoutProps {
  children: React.ReactNode;
  messages: Message[];
  currentSession: ChatSession | null;
  onSessionChange: (session: ChatSession | null) => void;
  onNewChat: () => void;
}

export function ChatLayout({
  children,
  messages,
  currentSession,
  onSessionChange,
  onNewChat,
}: ChatLayoutProps) {
  // Lazy initialization of sessions from localStorage
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    if (typeof window === "undefined") return [];
    return getAllChatSessions();
  });
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);

  // Use ref to track if we need to save (set by effect, read outside render)
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Memoize the serialized messages to detect changes
  const messagesKey = useMemo(() => {
    const filteredMessages = messages.filter((msg) => !msg.isLoading);
    return JSON.stringify(filteredMessages.map((m) => m.id));
  }, [messages]);

  // Save session when messages change - using debounced timeout
  useEffect(() => {
    if (!currentSession || messages.length === 0) return;

    // Filter out loading messages before saving
    const messagesToSave = messages.filter((msg) => !msg.isLoading);
    if (messagesToSave.length === 0) return;

    // Clear any existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Debounce the save operation
    saveTimeoutRef.current = setTimeout(() => {
      const updatedSession: ChatSession = {
        ...currentSession,
        messages: messagesToSave,
        title: generateChatTitle(messagesToSave),
        updatedAt: new Date().toISOString(),
      };

      saveChatSession(updatedSession);

      // Update sessions list
      setSessions((prev) => {
        const existingIndex = prev.findIndex(
          (s) => s.id === updatedSession.id
        );
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = updatedSession;
          return updated;
        }
        return [updatedSession, ...prev];
      });
    }, 300);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messagesKey, currentSession?.id]);

  // Re-sync sessions from localStorage on mount (client-side only)
  useEffect(() => {
    setSessions(getAllChatSessions());
  }, []);

  const handleNewChat = useCallback(() => {
    onNewChat();
    setIsMobileOpen(false);
  }, [onNewChat]);

  const handleSelectSession = useCallback(
    (session: ChatSession) => {
      onSessionChange(session);
      setIsMobileOpen(false);
    },
    [onSessionChange]
  );

  const handleDeleteSession = useCallback(
    (sessionId: string) => {
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));

      // If we deleted the current session, start a new chat
      if (currentSession?.id === sessionId) {
        handleNewChat();
      }
    },
    [currentSession, handleNewChat]
  );

  const handleToggleDesktopCollapse = useCallback(() => {
    setIsDesktopCollapsed((prev) => !prev);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar
          sessions={sessions}
          currentSessionId={currentSession?.id ?? null}
          onSelectSession={handleSelectSession}
          onNewChat={handleNewChat}
          onDeleteSession={handleDeleteSession}
          isCollapsed={isDesktopCollapsed}
          onToggleCollapse={handleToggleDesktopCollapse}
        />
      </div>

      {/* Mobile Sidebar (Sheet) */}
      <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
        <SheetContent side="left" className="w-[280px] p-0">
          <SheetHeader className="border-b p-4">
            <SheetTitle>Chat History</SheetTitle>
          </SheetHeader>
          <MobileSidebarContent
            sessions={sessions}
            currentSessionId={currentSession?.id ?? null}
            onSelectSession={handleSelectSession}
            onNewChat={handleNewChat}
            onDeleteSession={handleDeleteSession}
          />
        </SheetContent>
      </Sheet>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile Header with Menu Button */}
        <header className="sticky top-0 z-10 flex h-14 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileOpen(true)}
            className="h-9 w-9"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Open menu</span>
          </Button>
          <div className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="Vitasigns"
              width={32}
              height={32}
              className="h-8 w-auto"
              priority
            />
            <h1 className="text-lg font-semibold">Vitasigns Training Bot</h1>
          </div>
        </header>

        {/* Desktop Header */}
        <header className="sticky top-0 z-10 hidden h-14 items-center border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:flex">
          <div className="mx-auto flex w-full max-w-3xl items-center gap-2">
            <Image
              src="/logo.png"
              alt="Vitasigns"
              width={36}
              height={36}
              className="h-9 w-auto"
              priority
            />
            <h1 className="text-lg font-semibold">Vitasigns Training Bot</h1>
          </div>
        </header>

        {/* Chat Content */}
        <main
          className={cn(
            "flex flex-1 flex-col overflow-hidden",
            "mx-auto w-full max-w-3xl"
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
