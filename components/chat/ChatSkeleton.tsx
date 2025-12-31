"use client";

import { Skeleton } from "@/components/ui/skeleton";

/**
 * Loading skeleton for the chat interface
 * Shows placeholder content while the app is hydrating
 */
export function ChatSkeleton() {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar Skeleton (Desktop) */}
      <div className="hidden w-64 flex-shrink-0 border-r bg-muted/30 md:block">
        <div className="flex h-14 items-center justify-between border-b px-4">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-8 rounded-md" />
        </div>
        <div className="p-4 space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-3/4" />
        </div>
      </div>

      {/* Main Content Skeleton */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header Skeleton */}
        <header className="flex h-14 items-center gap-3 border-b px-4">
          <Skeleton className="h-9 w-9 rounded-full md:hidden" />
          <Skeleton className="h-8 w-8 rounded-md" />
          <Skeleton className="h-5 w-48" />
        </header>

        {/* Content Skeleton */}
        <div className="flex flex-1 flex-col items-center justify-center px-4">
          {/* Logo placeholder */}
          <Skeleton className="mb-6 h-20 w-20 rounded-full" />

          {/* Welcome text placeholder */}
          <Skeleton className="mb-2 h-8 w-64" />
          <Skeleton className="mb-8 h-4 w-80" />

          {/* Suggested questions skeleton */}
          <div className="w-full max-w-lg space-y-3">
            <div className="flex items-center gap-2 mb-4">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-48" />
            </div>
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        </div>

        {/* Input Skeleton */}
        <div className="border-t p-4">
          <div className="mx-auto max-w-3xl">
            <Skeleton className="h-12 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
