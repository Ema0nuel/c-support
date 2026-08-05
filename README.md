# C-Support

AI-powered customer support system with RAG-enhanced responses and business-adaptive onboarding.

## Thesis

**Title:** Reconstruction and Fine-Tuning of the DeepSeek Large Language Model for Artificial Intelligence-Powered Customer Support

## Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| Framework | Next.js 16 | App Router, React 19, TypeScript |
| Styling | Tailwind CSS v4 | Brand tokens in `app/globals.css` |
| State | Zustand | With persist middleware |
| Animations | Framer Motion | UI transitions |
| UI Primitives | Radix UI | Dialog, Dropdown, Label, Select |
| Icons | Lucide React | Icon library |
| Database | better-sqlite3 | Server-side SQLite (demo) |
| AI Model | DeepSeek | Fine-tuned via LoRA/QLoRA |
| RAG | pgvector + embeddings | Vector search for policy retrieval |

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Lint
npm run lint
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Project Structure

```
c-support/
├── app/                    # App Router — all routes
│   ├── globals.css         # Brand tokens (Tailwind v4)
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Splash page
├── lib/                    # Shared utilities
│   └── utils.ts            # cn() class merger
├── policy/                 # Training dataset
├── public/                 # Static assets
├── docs/                   # Design specs & plans
├── DESIGN.md               # Visual system document
└── README.md               # This file
```

## Development Notes

- **Dual-backend strategy:** Python FastAPI (thesis artifact) + Next.js API routes (working demo)
- **Design tokens:** Defined in `app/globals.css` via Tailwind v4 `@theme inline`
- **Component pattern:** Radix primitives + CVA variants + Tailwind utilities + `cn()` class merging
- **Font:** Geist Sans (UI) + Geist Mono (code) via `next/font/google`

## Academic Notice

This project is a BSc thesis deliverable. The training dataset in `policy/` is curated for research purposes. Model fine-tuning uses QLoRA (4-bit NF4) on Google Colab with a free-tier T4 GPU.
