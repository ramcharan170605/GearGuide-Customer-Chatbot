# GearGuide Customer Chatbot

A premium, production-ready React/Next.js frontend for the GearGuide AI chatbot. This chatbot connects to a remote n8n orchestration workflow that utilizes vector search and AI agent logic to answer customer queries.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Styling**: Tailwind CSS v4
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Markdown Rendering**: React Markdown + Remark GFM
- **Backend Orchestration**: n8n AI Agent Workflow

## n8n Orchestration Architecture

The chatbot interacts with an n8n workflow designed as a retrieval-augmented generation (RAG) agent:
1. **Webhook Trigger**: Receives a `POST` request containing the user's `chatInput` and a unique `sessionId`.
2. **AI Agent Node**: Orchestrates the response logic using `GPT-4o-mini` (OpenRouter).
3. **Memory**: Uses `Postgres Chat Memory` to persist multi-turn conversational history tied to the `sessionId`.
4. **Vector Store**: Queries a `Supabase Vector Store` with custom `HuggingFace sentence-transformers` embeddings to retrieve product knowledge.
5. **Respond to Webhook**: Returns a JSON object containing the finalized response text.

## Environment Variables for Vercel Deployment

When deploying this frontend on Vercel, you need to configure the following environment variables:

| Variable Name | Description | Value / Example |
|---|---|---|
| `NEXT_PUBLIC_N8N_WEBHOOK_URL` | The production URL of the n8n webhook trigger. | `https://charansurebrec.qzz.io/webhook/5025032e-9143-4ed2-808e-11f56d04a4ea` |

*Note: Since the API routing is handled by the Next.js backend proxy (`src/app/api/chat/route.js`), defining the webhook URL as an environment variable allows you to change the endpoint without rebuilding or redeploying the application.*

## Getting Started

### Installation

Install the required packages:
```bash
npm install
```

### Run Locally

Start the Next.js development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to test the chatbot.
