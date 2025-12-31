# PRD: Vitasigns Training Bot (RAG)

## 1. Project Overview
**Goal:** Build a lightweight, internal "Chat with Data" application for Vitasigns.
**Purpose:** Allow new hires to ask questions about clinical SOPs, HubSpot workflows, and HealthArc navigation.
**Architecture:** RAG (Retrieval-Augmented Generation) application that retrieves relevant context from uploaded PDFs and generates answers using OpenAI.

---

## 2. Tech Stack (Strict)
* **Frontend/Framework:** Next.js 14 (App Router)
* **Language:** TypeScript
* **Styling:** Tailwind CSS + Shadcn/UI
* **Deployment:** Vercel
* **Vector Database:** Pinecone (Serverless)
* **LLM:** OpenAI `gpt-4o-mini` (Cost-effective, fast)
* **PDF Parsing:** `pdf-parse` (Server-side ingestion)
* **Embeddings:** `text-embedding-3-small`
* **AI SDK:** Vercel AI SDK (`ai`, `openai` packages)

---

## 3. Core Features

### A. Admin / Ingestion (Local Script)
* **Functionality:** A script to process the "Vitasigns Patient Onboarding" and "Clinical RPM" PDFs.
* **Workflow:**
    1.  Read PDF files from a local `/docs` folder.
    2.  Extract text using `pdf-parse`.
    3.  Split text into chunks (Target: 1000 characters with 200 character overlap).
    4.  Generate embeddings for each chunk using OpenAI `text-embedding-3-small`.
    5.  Upsert vectors to Pinecone with metadata.

### B. Chat Interface
* **UI Layout:** Centered, clean chat window (similar to ChatGPT).
* **Components:**
    * Message List (Scrollable area).
    * Input Form (Text area + Send button).
    * Empty State (Welcome message + suggested questions).
* **Behavior:**
    * Streaming responses (real-time).
    * Distinct visual styles for User vs. AI messages.
* **Citations:** The AI must list the **Source Document** and **Page Number** at the bottom of the response if metadata is available.

### C. System Prompt Configuration
* **Implementation:** A designated constant file (e.g., `lib/constants.ts` or `lib/systemPrompt.ts`) that holds the system instructions. This ensures the "persona" is easily editable.

---

## 4. Data Schema & Configuration

### Environment Variables (.env.local)
```bash
OPENAI_API_KEY=sk-...
PINECONE_API_KEY=pc-...
PINECONE_INDEX_NAME=vitasigns-training