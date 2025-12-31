"use client";

import Image from "next/image";
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SUGGESTED_QUESTIONS } from "@/lib/constants";

interface EmptyStateProps {
  onSelectQuestion: (question: string) => void;
}

export function EmptyState({ onSelectQuestion }: EmptyStateProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-12">
      {/* Logo */}
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/5 p-2">
        <Image
          src="/logo.png"
          alt="Vitasigns"
          width={64}
          height={64}
          className="h-16 w-auto"
          priority
        />
      </div>

      {/* Welcome Text */}
      <h2 className="mb-2 text-2xl font-semibold tracking-tight">
        Welcome to Vitasigns Training Bot
      </h2>
      <p className="mb-8 max-w-md text-center text-muted-foreground">
        I am your AI assistant for Vitasigns training. Ask me about clinical SOPs,
        HubSpot workflows, or HealthArc navigation.
      </p>

      {/* Suggested Questions */}
      <div className="w-full max-w-lg">
        <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
          <MessageSquare className="h-4 w-4" />
          <span>Try asking one of these questions:</span>
        </div>
        <div className="flex flex-col gap-2">
          {SUGGESTED_QUESTIONS.map((question, index) => (
            <Button
              key={index}
              variant="outline"
              className="h-auto w-full justify-start whitespace-normal px-4 py-3 text-left text-sm"
              onClick={() => onSelectQuestion(question)}
            >
              {question}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
