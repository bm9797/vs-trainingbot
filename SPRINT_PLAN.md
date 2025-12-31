# Vitasigns Training Bot - Sprint Plan

## Project Summary
Build a RAG (Retrieval-Augmented Generation) chat application for Vitasigns new hire training on clinical SOPs, HubSpot workflows, and HealthArc navigation.

---

## Sprint 1: Foundation & Setup (Day 1)

### 1.1 Project Initialization
- [ ] Initialize Next.js 14 with App Router and TypeScript
- [ ] Configure Tailwind CSS
- [ ] Install and configure Shadcn/UI
- [ ] Set up project folder structure

### 1.2 Environment & Configuration
- [ ] Create `.env.local` template with required variables
- [ ] Create `lib/constants.ts` for system prompt
- [ ] Set up TypeScript path aliases
- [ ] Create `/docs` folder for PDF source files

### Deliverables
- Running Next.js dev server
- Configured styling system
- Environment template ready

---

## Sprint 2: PDF Ingestion Pipeline (Day 2)

### 2.1 Ingestion Script
- [ ] Create `scripts/ingest.ts` for PDF processing
- [ ] Implement PDF text extraction with `pdf-parse`
- [ ] Build text chunking logic (1000 chars, 200 overlap)
- [ ] Add metadata extraction (source, page number)

### 2.2 Vector Database Integration
- [ ] Set up Pinecone client connection
- [ ] Implement embedding generation with OpenAI
- [ ] Create upsert logic for vectors + metadata
- [ ] Add CLI script runner in `package.json`

### Deliverables
- Working `npm run ingest` command
- PDFs processed and stored in Pinecone

---

## Sprint 3: Chat Interface (Day 3)

### 3.1 UI Components
- [ ] Create chat page layout (`app/page.tsx`)
- [ ] Build `MessageList` component (scrollable)
- [ ] Build `ChatInput` component (textarea + send)
- [ ] Build `Message` component (user vs AI styling)
- [ ] Create empty state with welcome message

### 3.2 Suggested Questions
- [ ] Add suggested question chips
- [ ] Implement click-to-send functionality

### Deliverables
- Complete chat UI (non-functional)
- Responsive, clean design

---

## Sprint 4: RAG Backend (Day 4)

### 4.1 API Route
- [ ] Create `app/api/chat/route.ts`
- [ ] Implement query embedding generation
- [ ] Add Pinecone similarity search
- [ ] Build context assembly from retrieved chunks

### 4.2 Streaming Response
- [ ] Integrate Vercel AI SDK
- [ ] Configure OpenAI `gpt-4o-mini` streaming
- [ ] Connect system prompt from constants

### Deliverables
- Working `/api/chat` endpoint
- Streaming responses with context

---

## Sprint 5: Citations & Polish (Day 5)

### 5.1 Citation Display
- [ ] Parse source metadata from responses
- [ ] Build `Citation` component
- [ ] Display source document + page number

### 5.2 Final Polish
- [ ] Error handling and loading states
- [ ] Mobile responsiveness check
- [ ] Performance optimization
- [ ] Create README with setup instructions

### Deliverables
- Production-ready application
- Documentation for deployment

---

## Tech Stack Reference

| Component | Technology |
|-----------|------------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + Shadcn/UI |
| Vector DB | Pinecone (Serverless) |
| LLM | OpenAI gpt-4o-mini |
| Embeddings | text-embedding-3-small |
| PDF Parsing | pdf-parse |
| AI SDK | Vercel AI SDK |
| Deployment | Vercel |

---

## Folder Structure (Target)

```
TrainingBot/
├── app/
│   ├── api/
│   │   └── chat/
│   │       └── route.ts
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── ui/              # Shadcn components
│   ├── chat/
│   │   ├── MessageList.tsx
│   │   ├── ChatInput.tsx
│   │   ├── Message.tsx
│   │   └── Citation.tsx
│   └── EmptyState.tsx
├── lib/
│   ├── constants.ts     # System prompt
│   ├── pinecone.ts      # Pinecone client
│   ├── openai.ts        # OpenAI client
│   └── utils.ts
├── scripts/
│   └── ingest.ts        # PDF ingestion
├── docs/                # Source PDFs
├── .env.local
└── package.json
```

---

## Environment Variables Required

```bash
OPENAI_API_KEY=sk-...
PINECONE_API_KEY=pc-...
PINECONE_INDEX_NAME=vitasigns-training
```

---

## Ready to Execute

Run `/agent-dev` to begin Sprint 1 scaffolding.
