import { SUGGESTED_QUESTIONS } from "@/lib/constants";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <main className="flex w-full max-w-3xl flex-col items-center gap-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight">
            Vitasigns Training Bot
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Your AI assistant for clinical SOPs, HubSpot workflows, and HealthArc navigation
          </p>
        </div>

        {/* Chat Interface Placeholder */}
        <div className="w-full rounded-lg border bg-card p-6 shadow-sm">
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 text-5xl">
              <span role="img" aria-label="robot">
                {/* Robot icon placeholder */}
              </span>
            </div>
            <h2 className="text-xl font-semibold">Welcome to Training Bot</h2>
            <p className="mt-2 max-w-md text-muted-foreground">
              Ask me anything about Vitasigns procedures, HubSpot workflows, or HealthArc navigation.
              I am here to help you get up to speed quickly.
            </p>
          </div>
        </div>

        {/* Suggested Questions */}
        <div className="w-full">
          <h3 className="mb-3 text-sm font-medium text-muted-foreground">
            Suggested questions to get started:
          </h3>
          <div className="flex flex-wrap gap-2">
            {SUGGESTED_QUESTIONS.map((question, index) => (
              <button
                key={index}
                className="rounded-full border bg-secondary px-4 py-2 text-sm transition-colors hover:bg-secondary/80"
              >
                {question}
              </button>
            ))}
          </div>
        </div>

        {/* Chat Input Placeholder */}
        <div className="w-full">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Ask a question about Vitasigns training..."
              className="flex-1 rounded-lg border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              disabled
            />
            <button
              className="rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
              disabled
            >
              Send
            </button>
          </div>
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Chat functionality will be enabled in Sprint 3
          </p>
        </div>
      </main>
    </div>
  );
}
