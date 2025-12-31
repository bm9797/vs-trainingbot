# Vitasigns Training Bot - Setup Guide

Complete setup instructions for deploying the Vitasigns Training Bot.

---

## Prerequisites

- Node.js 18+ installed
- npm or yarn package manager
- OpenAI API account
- Pinecone account (free tier works)
- Vercel account (for deployment)

---

## 1. Environment Setup

### Create Environment File

Copy the example environment file:

```bash
cp .env.example .env.local
```

### Configure API Keys

Edit `.env.local` with your credentials:

```bash
# OpenAI API Key
# Get from: https://platform.openai.com/api-keys
OPENAI_API_KEY=sk-your-openai-api-key-here

# Pinecone API Key
# Get from: https://app.pinecone.io/ → API Keys
PINECONE_API_KEY=your-pinecone-api-key-here

# Pinecone Index Name
# This is the name of your Pinecone index (create in step 2)
PINECONE_INDEX_NAME=vitasigns-training
```

---

## 2. Pinecone Setup

### Create a Pinecone Index

1. Log in to [Pinecone Console](https://app.pinecone.io/)
2. Click **"Create Index"**
3. Configure the index:
   - **Index Name**: `vitasigns-training` (must match `.env.local`)
   - **Dimensions**: `1536` (required for OpenAI text-embedding-3-small)
   - **Metric**: `cosine`
   - **Cloud Provider**: Choose your preferred (AWS recommended)
   - **Region**: Choose closest to your users
4. Click **"Create Index"**
5. Wait for the index to initialize (usually 1-2 minutes)

### Get Your API Key

1. In Pinecone Console, go to **API Keys**
2. Copy the API key
3. Paste into your `.env.local` file

---

## 3. Add Your Logo

Place your Vitasigns logo in the public folder:

```bash
# Save your logo as:
public/logo.png

# Optionally add a favicon:
public/favicon.ico
```

**Recommended logo specs:**
- Format: PNG with transparent background
- Size: 64x64 pixels or larger
- The app will scale it to ~32-40px height

---

## 4. Add Training Documents

Place your PDF training documents in the `/docs` folder:

```bash
docs/
├── Vitasigns_Patient_Onboarding.pdf
├── Clinical_RPM_Guide.pdf
├── HubSpot_Workflows.pdf
└── HealthArc_Navigation.pdf
```

**Supported formats:** PDF only (for now)

---

## 5. Install Dependencies

```bash
npm install
```

---

## 6. Ingest Documents to Pinecone

Run the ingestion script to process your PDFs and upload to Pinecone:

```bash
npm run ingest
```

This will:
1. Read all PDFs from `/docs`
2. Extract and chunk the text
3. Generate embeddings via OpenAI
4. Upload vectors to Pinecone

**Expected output:**
```
[Ingest] Starting PDF ingestion...
[Ingest] Found 4 PDF files to process
[Ingest] Processing: Vitasigns_Patient_Onboarding.pdf
[Ingest] Extracted 45 pages, 127 chunks
[Ingest] Generating embeddings...
[Ingest] Uploading to Pinecone...
[Ingest] Complete! Processed 4 files, 512 total chunks
```

**Note:** Re-run this command whenever you add or update documents.

---

## 7. Run Locally

Start the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 8. Deploy to Vercel

### Option A: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Option B: Deploy via GitHub

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click **"Import Project"**
4. Select your repository
5. Add environment variables:
   - `OPENAI_API_KEY`
   - `PINECONE_API_KEY`
   - `PINECONE_INDEX_NAME`
6. Click **"Deploy"**

### Environment Variables in Vercel

In your Vercel project settings, add:

| Variable | Value |
|----------|-------|
| `OPENAI_API_KEY` | Your OpenAI API key |
| `PINECONE_API_KEY` | Your Pinecone API key |
| `PINECONE_INDEX_NAME` | `vitasigns-training` |

---

## Configuration

### Customize the System Prompt

Edit `lib/constants.ts` to change the bot's personality and behavior:

```typescript
export const SYSTEM_PROMPT = `You are the Vitasigns Training Assistant...`;
```

### Customize Suggested Questions

Edit the `SUGGESTED_QUESTIONS` array in `lib/constants.ts`:

```typescript
export const SUGGESTED_QUESTIONS = [
  "How do I onboard a new patient?",
  "What are the clinical RPM protocols?",
  // Add your own questions
];
```

### Adjust RAG Settings

In `lib/constants.ts`:

```typescript
export const PINECONE_CONFIG = {
  topK: 5,        // Number of chunks to retrieve
  minScore: 0.7,  // Minimum similarity score
};
```

---

## Troubleshooting

### "No relevant training documents found"
- Ensure you ran `npm run ingest`
- Check that PDFs are in the `/docs` folder
- Verify Pinecone index has vectors (check Pinecone console)

### "API configuration error"
- Verify `OPENAI_API_KEY` is set correctly
- Check API key has credits/is active

### "Knowledge base temporarily unavailable"
- Verify `PINECONE_API_KEY` is correct
- Check Pinecone index name matches `.env.local`
- Ensure Pinecone index is in "Ready" state

### Build Errors
```bash
# Clear cache and rebuild
rm -rf .next
npm run build
```

---

## Project Structure

```
TrainingBot/
├── app/
│   ├── api/chat/route.ts    # RAG API endpoint
│   ├── layout.tsx           # App layout + metadata
│   ├── page.tsx             # Main chat page
│   └── globals.css          # Global styles
├── components/
│   ├── chat/                # Chat UI components
│   └── ui/                  # Shadcn components
├── lib/
│   ├── constants.ts         # Config + system prompt
│   ├── openai.ts            # OpenAI client
│   ├── pinecone.ts          # Pinecone client
│   ├── rag.ts               # RAG retrieval logic
│   └── chatStorage.ts       # localStorage helpers
├── scripts/
│   └── ingest.ts            # PDF ingestion script
├── docs/                    # Your PDF documents
├── public/
│   ├── logo.png             # Vitasigns logo
│   └── favicon.ico          # Browser favicon
└── .env.local               # Environment variables
```

---

## Updating Documents

When you have new or updated training materials:

1. Add/replace PDFs in `/docs`
2. Run `npm run ingest`
3. Changes are immediately available (no redeploy needed for Pinecone data)

---

## Cost Estimates

| Service | Usage | Estimated Cost |
|---------|-------|----------------|
| OpenAI GPT-4o-mini | ~$0.15 per 1M input tokens | ~$5-10/month for light usage |
| OpenAI Embeddings | ~$0.02 per 1M tokens | ~$1-2 one-time for ingestion |
| Pinecone | Free tier: 100K vectors | $0 (free tier) |
| Vercel | Free tier: 100GB bandwidth | $0 (free tier) |

---

## Support

For issues or questions:
- Check the troubleshooting section above
- Review Pinecone and OpenAI documentation
- Contact your development team

---

## Quick Start Checklist

- [ ] Create `.env.local` with API keys
- [ ] Create Pinecone index (1536 dimensions, cosine metric)
- [ ] Add logo to `public/logo.png`
- [ ] Add PDFs to `docs/` folder
- [ ] Run `npm install`
- [ ] Run `npm run ingest`
- [ ] Run `npm run dev` to test locally
- [ ] Deploy to Vercel with environment variables
