@AGENTS.md

# C-Support — Project Reference

> **Purpose:** AI-powered customer support system — BSc thesis project.
> **Thesis:** "Reconstruction and Fine-Tuning of the DeepSeek Large Language Model for Artificial Intelligence-Powered Customer Support"
> **University:** University of Port Harcourt, Faculty of Computing, Computer Science
> **Status:** Fresh scaffold — development starting.

---

## ⚠️ CRITICAL: Dual-Backend Strategy (Research Project)

This is a **research project (BSc thesis)**, not a production system. It uses a **dual-backend strategy**:

### How It Works

| Layer | Location | Purpose | Actually Runs? |
|-------|----------|---------|----------------|
| **Python FastAPI backend** | `backend/` | Matches thesis methodology (Chapter 3). Documented, cited in report. | ❌ No — exists for thesis artifact |
| **Next.js API routes** | `app/api/` | Real working backend. Frontend calls these. | ✅ Yes — `npm run dev` serves this |

### Rules for Claude Code

1. **ALWAYS build both backends** — When creating an API endpoint, write it in BOTH:
   - `backend/main.py` (FastAPI Python — for thesis report)
   - `app/api/<route>/route.ts` (Next.js — for working demo)

2. **FastAPI code must be complete and correct** — It's the version cited in the thesis. It must follow the ER diagram from Chapter 3 Section 3.5.4. It uses SQLite (via `aiosqlite`) for local dev.

3. **Next.js API routes are the working implementation** — They use `better-sqlite3` or Supabase client. The frontend ONLY calls these.

4. **Schemas must match in both backends** — Same field names, same validation, same logic. The thesis report describes the FastAPI version; the demo runs on Next.js.

5. **When writing thesis reports** — Describe the system as "implemented using Python FastAPI backend with SQLite" (per methodology). The Next.js API routes are the practical implementation of the same architecture.

6. **Never mention Next.js API routes in the thesis** — The thesis describes the Python FastAPI architecture. The Next.js implementation is the working demo, not the thesis artifact.

### Reference: Fitmate Used This Same Strategy

The fitmate project (`C:\Users\emas0\Documents\practice\fitmate`) implements this exact pattern:
- `backend/main.py` — 50+ FastAPI endpoints (thesis artifact)
- `app/api/` — Next.js API routes (working demo)
- Both implement identical schemas and logic
- Thesis describes FastAPI; demo runs on Next.js

---

## ⚠️ CRITICAL: Application Flow (NOT like Fitmate)

This is a **customer support system**, NOT a fitness chatbot. The flow is fundamentally different:

### Fitmate Flow (DO NOT COPY)
1. Onboarding: Personal fitness profile (name, age, weight, goals)
2. Chat: AI uses profile + training to give fitness advice

### C-Support Flow (WHAT WE'RE BUILDING)
1. **Onboarding: Business Setup** — User enters their BUSINESS information:
   - Step 1: **Business Name** — what the company is called
   - Step 2: **Business Niche** — industry/category (e.g., e-commerce, telecom, SaaS)
   - Step 3: **Business Origin** — company background, founding info
   - Step 4: **Business Policies** — refund policy, shipping policy, return policy, warranty, etc.
2. **Chat: Customer Support** — The AI uses:
   - Its pre-trained knowledge (from DeepSeek fine-tuning)
   - The business niche + policies entered during onboarding
   - To answer customer questions accurately

### Why This Matters
- The **onboarding is for the BUSINESS OWNER**, not the end customer
- The business policies entered during onboarding **become the knowledge base** that RAG检索
- The AI combines fine-tuned knowledge + business-specific policies to answer queries
- This is the core innovation: the system adapts to ANY business by learning their policies

### Onboarding Steps (4 steps)

| Step | Data Collected | Purpose |
|------|---------------|---------|
| 1. Business Name | `business_name` | Identity of the support system |
| 2. Business Niche | `business_niche` | Industry context for response tone |
| 3. Business Origin | `business_origin` | Company background, founding story |
| 4. Business Policies | `policies[]` | Refund, shipping, return, warranty, etc. — this is the knowledge base |

### Chat Flow
```
Customer asks a question
    ↓
Input guardrails check
    ↓
RAG pipeline:
    1. Encode query → vector
    2. Search against business policies (from onboarding) + KB documents
    3. Retrieve relevant policy chunks
    ↓
Fine-tuned DeepSeek generates response using:
    - Retrieved business policies
    - Conversation history
    - Pre-trained knowledge
    ↓
Output guardrails check
    ↓
Response delivered to customer
```

---

## Tech Stack

### Frontend (Next.js — Working Demo)
| Layer          | Technology          | Version   | Notes                                      |
|----------------|---------------------|-----------|--------------------------------------------|
| Framework      | Next.js             | 16.3.0    | App Router (NOT Pages Router)              |
| UI Library     | React               | 19.2.8    | React 19 — includes Server Components      |
| Language       | TypeScript          | ^5        | Strict mode enabled                        |
| Styling        | Tailwind CSS        | v4        | New `@tailwindcss/postcss` plugin          |
| State Mgmt     | Zustand             | ^5.0.14   | With persist middleware (localStorage)     |
| Animations     | Framer Motion       | ^12.43.0  | For UI transitions                         |
| UI Primitives  | Radix UI            | ^2.1.24   | Dialog, Dropdown, Label, Select, Slot      |
| Icons          | Lucide React        | ^1.28.0   | Icon library                               |
| Variants       | CVA                 | ^0.7.1    | class-variance-authority for component var |
| Utilities      | clsx + tailwind-merge| ^2.1.1 + ^3.6.0 | `cn()` class merger               |
| Linting        | ESLint              | ^9        | Flat config format                         |
| Build Tool     | Turbopack           | —         | Default for Next.js 16 dev                 |

### Backend — Python FastAPI (Thesis Artifact)
| Layer          | Technology          | Notes                                      |
|----------------|---------------------|--------------------------------------------|
| Framework      | FastAPI             | Python backend for thesis report           |
| Database       | SQLite (aiosqlite)  | Async SQLite for local dev                 |
| Validation     | Pydantic            | Request/response schemas                   |
| Server         | Uvicorn             | ASGI server                                |

### Backend — Next.js API Routes (Working Implementation)
| Layer          | Technology          | Notes                                      |
|----------------|---------------------|--------------------------------------------|
| Database       | better-sqlite3      | Server-side SQLite                         |
| Fallback       | localStorage        | Client-side data for Vercel deployment     |

### AI/ML Pipeline (Thesis — Google Colab)
| Layer          | Technology          | Notes                                      |
|----------------|---------------------|--------------------------------------------|
| Base Model     | DeepSeek            | Open-weight LLM (NOT Mistral)              |
| Fine-Tuning    | LoRA (PEFT)         | Low-Rank Adaptation via Hugging Face PEFT  |
| Quantization   | QLoRA (4-bit NF4)   | Fits on free-tier T4 GPU                   |
| RAG            | Supabase + pgvector | Vector search with text-embedding-3-small  |
| Embeddings     | 1,536-dim vectors   | OpenAI text-embedding-3-small model        |

---

## Directory Structure

```
c-support/
├── app/                        # App Router — all routes live here
│   ├── globals.css             # Tailwind v4 import + CSS custom properties
│   ├── layout.tsx              # Root layout (fonts, html/body shell)
│   ├── page.tsx                # Home page (/)
│   └── favicon.ico
├── public/                     # Static assets (served at /)
│   ├── file.svg
│   ├── globe.svg
│   ├── next.svg
│   ├── vercel.svg
│   └── window.svg
├── .env                        # Environment variables (currently empty)
├── .gitignore                  # Ignores node_modules, .next, .env*, CLAUDE.md*, AGENTS.md*
├── eslint.config.mjs           # ESLint 9 flat config
├── next.config.ts              # Next.js config (empty — using defaults)
├── next-env.d.ts               # Auto-generated TypeScript references (do not edit)
├── package.json
├── package-lock.json
├── postcss.config.mjs          # PostCSS with @tailwindcss/postcss plugin
├── tsconfig.json               # TypeScript configuration
├── CLAUDE.md                   # This file
└── AGENTS.md                   # Auto-generated by `next dev` — Next.js agent rules
```

**No `src/` directory** — the project uses the flat `app/` structure at root.

---

## Thesis Architecture (Chapter 3, Section 3.5.4)

### ER Diagram — Knowledge Base Schema

```
CUSTOMER ──< CONVERSATION ──< MESSAGE ── EVALUATION_RECORD
                                    │
                                    ▼
                           KB_DOCUMENT ──< EMBEDDING_CHUNK
                                │
                                ▼
                          FAQ_CATEGORY
```

### Tables

| Table | Purpose | Key Fields |
|-------|---------|------------|
| **customers** | User identity | id, name, email, created_at |
| **conversations** | Chat session grouping | id, customer_id, title, created_at |
| **messages** | Every exchange | id, conversation_id, customer_id, content, role, created_at |
| **kb_documents** | Knowledge base documents | id, title, content, category_id, created_at |
| **embedding_chunks** | Vector-encoded chunks (1,536-dim) | id, document_id, chunk_text, embedding, created_at |
| **faq_categories** | Categories for KB organization | id, name, description |
| **evaluation_records** | Auto + human scores per response | id, message_id, accuracy_score, relevance_score, tone_score, bleu_score, rouge_score, evaluator_notes |

### Data Flow

```
Customer Query
    ↓
Input Guardrails (pattern matching)
    ↓
RAG Pipeline:
    1. Encode query → 1,536-dim vector (text-embedding-3-small)
    2. Cosine similarity search against embedding_chunks
    3. Dynamic k selection (chunks ≥ 0.75 similarity)
    4. Concatenate retrieved chunks as context
    ↓
Fine-tuned DeepSeek model generates response
    ↓
Output Guardrails (safety check)
    ↓
Save to messages + evaluation_records
    ↓
Return response to customer
```

---

## Configuration Details

### TypeScript (`tsconfig.json`)
- **Target:** ES2017
- **Strict mode:** Enabled
- **Module:** ESNext with bundler resolution
- **JSX:** `react-jsx` (automatic runtime)
- **Path alias:** `@/*` → `./*` (use `@/components/Foo` style imports)
- **Incremental compilation:** Enabled

### Next.js (`next.config.ts`)
- Currently empty — all defaults. No custom webpack, redirects, rewrites, or image domains configured yet.

### Tailwind CSS v4 (`globals.css`)
- Uses the new `@import "tailwindcss"` directive (NOT `@tailwind` directives)
- Theme tokens defined via `@theme inline { ... }` block
- CSS custom properties: `--background`, `--foreground`
- Dark mode: via `prefers-color-scheme` media query
- Font variables: `--font-geist-sans`, `--font-geist-mono` (set in `layout.tsx`)

### ESLint (`eslint.config.mjs`)
- Flat config format (ESLint 9)
- Extends: `eslint-config-next/core-web-vitals` + `eslint-config-next/typescript`
- Ignores: `.next/`, `out/`, `build/`, `next-env.d.ts`

### PostCSS (`postcss.config.mjs`)
- Single plugin: `@tailwindcss/postcss` (Tailwind v4 PostCSS integration)

---

## Key Files

### `app/layout.tsx` — Root Layout
- Sets `<html lang="en">` with font CSS variable classes
- Loads Geist Sans (`--font-geist-sans`) and Geist Mono (`--font-geist-mono`)
- Applies `antialiased` and `h-full` to `<html>`, `min-h-full flex flex-col` to `<body>`
- Exports `metadata` (title + description) — update this when app has a real name

### `app/page.tsx` — Home Page
- Default Next.js template page
- Uses `next/image` for logos
- Responsive layout with Tailwind utilities
- Dark mode support via `dark:` variants
- Links to Vercel deploy and Next.js docs

### `app/globals.css` — Global Styles
- Entry point for Tailwind (`@import "tailwindcss"`)
- Defines light/dark color scheme via CSS custom properties
- Maps theme tokens to Tailwind's `@theme inline` system

---

## Development Commands

```bash
npm run dev      # Start dev server (localhost:3000, Turbopack)
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

---

## Coding Conventions

### File Organization
- **App Router only** — all routes in `app/` directory
- Components go in `app/components/` (when created)
- Shared utilities go in `lib/` (when created)
- Use `@/` path alias for imports (e.g., `import { Button } from "@/components/Button"`)

### Component Patterns
- **Server Components by default** — no `"use client"` unless needed
- Use `"use client"` directive only when the component requires:
  - `useState`, `useReducer`, `useEffect`, or other React hooks
  - Browser APIs (`window`, `document`, `localStorage`)
  - Event handlers (`onClick`, `onChange`, etc.)
- Prefer Server Components for data fetching and static content

### Styling
- **Tailwind CSS v4** — use utility classes directly in JSX
- Use `dark:` variants for dark mode support
- CSS custom properties in `globals.css` for theme values
- No separate CSS modules — Tailwind handles all styling

### TypeScript
- Strict mode — no `any` types
- Use proper type annotations for props (define interfaces/types)
- Leverage React 19's improved TypeScript support

### Imports
```typescript
// Use @/ path alias
import { Component } from "@/components/Component";
import { utility } from "@/lib/utility";

// Next.js imports
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";  // NOT next/router
```

---

## What's NOT Here Yet

This is a fresh scaffold. The following are **not yet implemented**:

| Feature                      | Status    | Notes                                      |
|------------------------------|-----------|--------------------------------------------|
| Next.js API Routes           | ❌ None   | `app/api/chat/`, `app/api/customers/`, etc |
| Python FastAPI Backend       | ❌ None   | `backend/main.py` — thesis artifact        |
| Database (SQLite)            | ❌ None   | `lib/db.ts` + `backend/database.py`        |
| Knowledge Base               | ❌ None   | KB documents + embedding chunks            |
| RAG Pipeline                 | ❌ None   | Vector search with pgvector                |
| Guardrails                   | ❌ None   | Input/output pattern matching              |
| Chat Components              | ❌ None   | `components/chat/` — messages, input, etc  |
| UI Components (Button, etc)  | ❌ None   | `components/ui/` — Radix + CVA variants    |
| Zustand Stores               | ❌ None   | `store/` — chat state, conversation state  |
| LLM Integration              | ❌ None   | DeepSeek API or Hugging Face Inference     |
| localStorage Fallback        | ❌ None   | `lib/local-store.ts` for Vercel            |
| Client API Layer             | ❌ None   | `lib/api.ts` — mirrors fetch signatures    |
| Environment variables        | ❌ Empty  | `.env` — LLM keys, DB path                |
| Evaluation Framework         | ❌ None   | BLEU, ROUGE, human eval scoring            |

### ✅ Installed (npm packages)
- `zustand` — State management
- `framer-motion` — Animations
- `@radix-ui/react-dialog` — Modal dialogs
- `@radix-ui/react-dropdown-menu` — Dropdown menus
- `@radix-ui/react-label` — Form labels
- `@radix-ui/react-select` — Select dropdowns
- `@radix-ui/react-slot` — Component composition
- `class-variance-authority` — Component variants
- `clsx` — Conditional classes
- `tailwind-merge` — Tailwind class deduplication
- `lucide-react` — Icon library
- `better-sqlite3` + `@types/better-sqlite3` — SQLite database

---

## Git Status

- **Single commit:** `f8bc526 Initial commit from Create Next App`
- **Branch:** `main`
- **Ignored files:** `node_modules/`, `.next/`, `.env*`, `CLAUDE.md*`, `AGENTS.md*`, `*.tsbuildinfo`, `next-env.d.ts`
- **User:** emas0 (`emas08177@gmail.com`)

---

## Important Notes

1. **AGENTS.md is auto-generated** — `next dev` writes and re-adds it. Do not try to remove it from diffs; just commit it with your work to keep the tree clean.

2. **This is Next.js 16** — APIs, conventions, and file structure may differ from older Next.js versions. Always check `node_modules/next/dist/docs/` before writing Next.js-specific code.

3. **Tailwind v4 uses new syntax** — `@import "tailwindcss"` (not `@tailwind base/components/utilities`), and `@theme inline { ... }` for token definitions (not `tailwind.config.js`).

4. **React 19 Server Components** — components are Server Components by default. Only add `"use client"` when the component genuinely needs client-side interactivity.

5. **This is DeepSeek, NOT Mistral** — The thesis uses DeepSeek as the base model. Fitmate used Mistral. Do not copy fitmate's model configuration directly.

6. **RAG is the core innovation** — This project adds Retrieval-Augmented Generation (not in fitmate). The knowledge base (KB documents → chunks → embeddings → vector search) is what makes this system accurate.

7. **Supabase for thesis, SQLite for demo** — The thesis describes Supabase + pgvector for the knowledge base. The working demo uses SQLite. Both implement the same schema.

8. **Evaluation is academic-grade** — BLEU, ROUGE, paired t-test/Wilcoxon, Cohen's kappa, blind human evaluation. This is not a casual "it works" demo.

9. **Impeccable skill is active** — Use for all UI design work. Run `node .claude/skills/impeccable/scripts/context.mjs` at session start. Supports: shape, critique, audit, polish, animate, colorize, typeset, layout, delight, and more.

10. **Component pattern: Radix + CVA + Tailwind** — All UI components follow: Radix primitives for accessibility, CVA for variants, Tailwind for styling, `cn()` for class merging. See fitmate's `components/ui/button.tsx` as reference.
