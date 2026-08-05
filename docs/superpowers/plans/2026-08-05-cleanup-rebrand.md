# C-Support Cleanup & Rebranding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove all `create-next-app` defaults and establish C-Support's visual identity with brand tokens, minimal splash page, and project documentation.

**Architecture:** Token-first approach — build the design system (CSS custom properties + Tailwind theme) before any UI. Each task produces a self-contained, verifiable change. No new dependencies needed — all packages already installed.

**Tech Stack:** Next.js 16 (App Router), React 19, Tailwind CSS v4, TypeScript, Geist fonts

## Global Constraints

- **Next.js 16:** Root layout uses `LayoutProps<"/">` type for props. Pages are Server Components by default.
- **Tailwind v4:** Uses `@import "tailwindcss"` (not `@tailwind` directives) and `@theme inline { }` for token definitions (not `tailwind.config.js`).
- **React 19:** Server Components by default. Only add `"use client"` when the component needs hooks, browser APIs, or event handlers.
- **No new dependencies:** All packages (clsx, tailwind-merge, lucide-react, etc.) are already installed.
- **Path alias:** `@/*` maps to `./*` — use `@/lib/utils` style imports.
- **Brand colors:** Primary `#024B41` (teal-950), Accent `#B8DE72` (lime-400), Base `#FFFFFF` (white).
- **Spec reference:** `docs/superpowers/specs/2026-08-05-cleanup-rebrand-design.md`

---

### Task 1: Create `cn()` Utility

**Files:**
- Create: `lib/utils.ts`

**Interfaces:**
- Produces: `cn(...inputs: ClassValue[]) => string` — class name merger used by all components

- [ ] **Step 1: Create the utils file**

```typescript
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

Write to: `lib/utils.ts`

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit lib/utils.ts`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add lib/utils.ts
git commit -m "feat: add cn() utility for class name merging"
```

---

### Task 2: Delete Default Assets & Replace Favicon

**Files:**
- Delete: `public/file.svg`
- Delete: `public/globe.svg`
- Delete: `public/next.svg`
- Delete: `public/vercel.svg`
- Delete: `public/window.svg`
- Delete: `app/favicon.ico`
- Create: `public/favicon.svg`

**Interfaces:**
- Produces: SVG favicon at `public/favicon.svg` — teal square with lime chat bubble

- [ ] **Step 1: Delete default Next.js SVGs**

```bash
rm public/file.svg public/globe.svg public/next.svg public/vercel.svg public/window.svg
```

- [ ] **Step 2: Delete default favicon**

```bash
rm app/favicon.ico
```

- [ ] **Step 3: Create SVG favicon**

Write to: `public/favicon.svg`

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none">
  <rect width="32" height="32" rx="6" fill="#024B41"/>
  <path d="M8 12c0-2.2 1.8-4 4-4h8c2.2 0 4 1.8 4 4v5c0 2.2-1.8 4-4 4h-2l-3 3v-3h-3c-2.2 0-4-1.8-4-4v-5z" fill="#B8DE72"/>
  <circle cx="13" cy="14.5" r="1.2" fill="#024B41"/>
  <circle cx="16" cy="14.5" r="1.2" fill="#024B41"/>
  <circle cx="19" cy="14.5" r="1.2" fill="#024B41"/>
</svg>
```

- [ ] **Step 4: Verify files exist/don't exist**

Run: `ls public/`
Expected: Only `favicon.svg` remains (no `.svg` defaults, no `.ico`)

- [ ] **Step 5: Commit**

```bash
git add -A public/ app/favicon.ico
git commit -m "feat: replace default assets with C-Support favicon"
```

---

### Task 3: Build Brand Token System in `globals.css`

**Files:**
- Modify: `app/globals.css` (replace entire content)

**Interfaces:**
- Consumes: Brand palette from spec (teal-950, lime-400, extended palette)
- Produces: CSS custom properties + Tailwind `@theme inline` block enabling `bg-teal-950`, `text-lime-400`, etc.

- [ ] **Step 1: Replace globals.css with brand token system**

Replace entire content of `app/globals.css` with:

```css
@import "tailwindcss";

/* ============================================
   C-Support Design Tokens
   ============================================ */

:root {
  /* Background & Foreground */
  --background: #F9FAFB;
  --foreground: #111827;

  /* Primary (Teal) */
  --primary: #024B41;
  --primary-foreground: #FFFFFF;

  /* Accent (Lime) */
  --accent: #B8DE72;
  --accent-foreground: #024B41;

  /* Muted */
  --muted: #F3F4F6;
  --muted-foreground: #6B7280;

  /* Border & Ring */
  --border: #E5E7EB;
  --ring: #024B41;
}

@media (prefers-color-scheme: dark) {
  :root {
    --background: #024B41;
    --foreground: #FFFFFF;

    --primary: #B8DE72;
    --primary-foreground: #024B41;

    --accent: #024B41;
    --accent-foreground: #FFFFFF;

    --muted: #1A3C37;
    --muted-foreground: #9CA3AF;

    --border: #1A3C37;
    --ring: #B8DE72;
  }
}

/* ============================================
   Tailwind v4 Theme Integration
   ============================================ */

@theme inline {
  /* Semantic tokens → Tailwind utilities */
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-border: var(--border);
  --color-ring: var(--ring);

  /* Extended palette — direct values */
  --color-teal-50: #F0FDF9;
  --color-teal-100: #CCFBF1;
  --color-teal-600: #0D9488;
  --color-teal-800: #115E59;
  --color-teal-950: #024B41;
  --color-lime-100: #ECFCCB;
  --color-lime-400: #B8DE72;
  --color-lime-500: #A3E635;
  --color-lime-600: #65A30D;
  --color-gray-50: #F9FAFB;
  --color-gray-100: #F3F4F6;
  --color-gray-400: #9CA3AF;
  --color-gray-500: #6B7280;
  --color-gray-900: #111827;

  /* Typography */
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}

/* ============================================
   Base Styles
   ============================================ */

body {
  background: var(--background);
  color: var(--foreground);
  font-family: var(--font-geist-sans), system-ui, sans-serif;
}
```

- [ ] **Step 2: Verify Tailwind processes the tokens**

Run: `npm run build 2>&1 | head -20`
Expected: Build starts without CSS errors (may fail later for missing components — that's fine, we just need CSS to compile)

- [ ] **Step 3: Commit**

```bash
git add app/globals.css
git commit -m "feat: add C-Support brand token system to globals.css"
```

---

### Task 4: Update Layout Metadata & Favicon Reference

**Files:**
- Modify: `app/layout.tsx`

**Interfaces:**
- Consumes: `public/favicon.svg` (from Task 2)
- Produces: Updated metadata with C-Support branding

- [ ] **Step 1: Update layout.tsx**

Replace entire content of `app/layout.tsx` with:

```tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "C-Support",
  description:
    "AI-powered customer support system with RAG-enhanced responses and business-adaptive onboarding.",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
```

- [ ] **Step 2: Verify metadata updates**

Run: `npm run build 2>&1 | head -30`
Expected: Build proceeds past layout compilation

- [ ] **Step 3: Commit**

```bash
git add app/layout.tsx
git commit -m "feat: update layout metadata and favicon for C-Support"
```

---

### Task 5: Build Minimal Splash Page

**Files:**
- Modify: `app/page.tsx` (replace entire content)

**Interfaces:**
- Consumes: Brand tokens from Task 3 (`bg-teal-950`, `text-lime-400`, etc.)
- Produces: C-Support splash page at `/`

- [ ] **Step 1: Replace page.tsx with splash page**

Replace entire content of `app/page.tsx` with:

```tsx
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-white px-6 dark:bg-teal-950">
      <main className="flex flex-col items-center text-center">
        {/* Logo Mark */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 64 64"
          fill="none"
          className="mb-8 h-16 w-16"
          aria-hidden="true"
        >
          <rect width="64" height="64" rx="12" fill="#024B41" />
          <path
            d="M16 24c0-4.4 3.6-8 8-8h16c4.4 0 8 3.6 8 8v10c0 4.4-3.6 8-8 8h-4l-6 6v-6h-6c-4.4 0-8-3.6-8-8V24z"
            fill="#B8DE72"
          />
          <circle cx="26" cy="29" r="2.4" fill="#024B41" />
          <circle cx="32" cy="29" r="2.4" fill="#024B41" />
          <circle cx="38" cy="29" r="2.4" fill="#024B41" />
        </svg>

        {/* Title */}
        <h1 className="text-4xl font-semibold tracking-tight text-gray-900 dark:text-white">
          C-Support
        </h1>

        {/* Tagline */}
        <p className="mt-2 text-lg text-gray-500 dark:text-teal-100">
          AI-Powered Customer Support System
        </p>

        {/* CTA Button */}
        <Link
          href="/onboarding"
          className="mt-8 inline-flex items-center rounded-lg bg-lime-400 px-8 py-3 font-medium text-teal-950 transition-colors hover:bg-lime-500 active:scale-[0.98]"
        >
          Get Started
        </Link>
      </main>

      {/* Footer */}
      <footer className="absolute bottom-8">
        <p className="text-sm text-gray-400 dark:text-teal-600">
          C-Support
        </p>
      </footer>
    </div>
  );
}
```

- [ ] **Step 2: Verify the page renders**

Run: `npm run build 2>&1 | tail -20`
Expected: Build completes successfully. Check for no TypeScript or compilation errors.

- [ ] **Step 3: Commit**

```bash
git add app/page.tsx
git commit -m "feat: add C-Support minimal splash page"
```

---

### Task 6: Write DESIGN.md

**Files:**
- Create: `DESIGN.md`

**Interfaces:**
- Produces: Complete visual system document for C-Support

- [ ] **Step 1: Create DESIGN.md**

Write to: `DESIGN.md`

```markdown
# C-Support Design System

## Brand Identity

- **Name:** C-Support
- **Voice:** Professional, helpful, concise — like a knowledgeable support agent
- **Tone:** Neutral and factual — no excessive enthusiasm or filler
- **Visual Personality:** Clean, trustworthy, research-grade

## Color Palette

### Primary

| Token | Hex | Use |
|-------|-----|-----|
| teal-950 | #024B41 | Primary — headers, CTAs, nav, footers |
| lime-400 | #B8DE72 | Accent — highlights, badges, active states |
| white | #FFFFFF | Base — backgrounds, cards, content areas |

### Extended

| Token | Hex | Use |
|-------|-----|-----|
| teal-50 | #F0FDF9 | Subtle teal background, hover states |
| teal-100 | #CCFBF1 | Light teal — tags, borders |
| teal-600 | #0D9488 | Secondary buttons, links |
| teal-800 | #115E59 | Text on light backgrounds |
| lime-100 | #ECFCCB | Success backgrounds |
| lime-500 | #A3E635 | Button hover state |
| lime-600 | #65A30D | Text on lime backgrounds |
| gray-50 | #F9FAFB | Page background (light mode) |
| gray-100 | #F3F4F6 | Card borders, dividers |
| gray-400 | #9CA3AF | Placeholder text |
| gray-500 | #6B7280 | Secondary text |
| gray-900 | #111827 | Primary text |

### Semantic Tokens

| Token | Light | Dark |
|-------|-------|------|
| --background | #F9FAFB | #024B41 |
| --foreground | #111827 | #FFFFFF |
| --primary | #024B41 | #B8DE72 |
| --primary-foreground | #FFFFFF | #024B41 |
| --accent | #B8DE72 | #024B41 |
| --accent-foreground | #024B41 | #FFFFFF |
| --muted | #F3F4F6 | #1A3C37 |
| --muted-foreground | #6B7280 | #9CA3AF |
| --border | #E5E7EB | #1A3C37 |
| --ring | #024B41 | #B8DE72 |

## Typography

- **Sans:** Geist Sans (`--font-geist-sans`) — all UI text
- **Mono:** Geist Mono (`--font-geist-mono`) — code, data, technical values
- **Scale:** Tailwind defaults (text-xs through text-4xl)
- **Weights:** font-normal (400) body, font-medium (500) buttons/labels, font-semibold (600) headings, font-bold (700) display

## Spacing & Layout

- **Spacing:** Tailwind 4px increment scale
- **Border radius:** rounded-md (6px) buttons/inputs, rounded-lg (8px) cards/modals, rounded-full badges/avatars
- **Shadows:** shadow-sm subtle lift, shadow-md cards, shadow-lg modals/dropdowns
- **Max content width:** max-w-md (448px) for focused forms, max-w-3xl (768px) for content

## Component Tokens

### Buttons

| Variant | Background | Text | Border | Hover |
|---------|-----------|------|--------|-------|
| Primary | lime-400 | teal-950 | none | lime-500 |
| Secondary | teal-950 | white | none | teal-800 |
| Ghost | transparent | gray-900 | none | gray-100 |

### Cards

- Background: white
- Border: gray-100 (1px)
- Radius: rounded-lg (8px)
- Shadow: shadow-sm

### Inputs

- Background: white
- Border: gray-100 (1px)
- Radius: rounded-md (6px)
- Focus ring: 2px ring color

### Badges

- Background: teal-50
- Text: teal-950
- Radius: rounded-full
- Padding: px-2.5 py-0.5

## Dark Mode

- Detected via `prefers-color-scheme: dark` media query
- Tokens invert via CSS custom properties in `@media (prefers-color-scheme: dark)` block
- No manual toggle — respects system preference
- Primary becomes lime-400, background becomes teal-950

## Do / Don't

### Do
- Use teal-950 for primary actions and navigation
- Use lime-400 for accent highlights, CTAs, and active states
- Maintain generous whitespace between sections
- Use semantic tokens (--primary, --accent) not raw hex values
- Keep typography hierarchy clear (size + weight differentiation)

### Don't
- Use lime for large background areas (it's an accent, not a base)
- Use more than 2 brand colors per screen
- Add gradients, decorative patterns, or unnecessary shadows
- Use shadows beyond the defined scale (shadow-sm/md/lg)
- Hardcode hex values in components — always use Tailwind theme tokens
```

- [ ] **Step 2: Verify file exists**

Run: `cat DESIGN.md | head -5`
Expected: Shows "# C-Support Design System"

- [ ] **Step 3: Commit**

```bash
git add DESIGN.md
git commit -m "docs: add DESIGN.md visual system document"
```

---

### Task 7: Replace README.md

**Files:**
- Modify: `README.md` (replace entire content)

**Interfaces:**
- Produces: Project-specific README with thesis context

- [ ] **Step 1: Replace README.md**

Replace entire content of `README.md` with:

```markdown
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
```

- [ ] **Step 2: Verify file updated**

Run: `head -3 README.md`
Expected: Shows "# C-Support"

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: replace README with C-Support project documentation"
```

---

### Task 8: Final Verification

**Files:** None modified — verification only

- [ ] **Step 1: Run dev server and check for errors**

Run: `npm run dev &` (background), then wait 5 seconds
Expected: Server starts on localhost:3000 without errors

- [ ] **Step 2: Run production build**

Run: `npm run build`
Expected: Build completes successfully with no errors

- [ ] **Step 3: Verify all files are in place**

Run: `ls lib/utils.ts DESIGN.md public/favicon.svg`
Expected: All three files exist

Run: `ls public/*.svg`
Expected: Only `favicon.svg` (no globe.svg, next.svg, etc.)

Run: `ls app/favicon.ico 2>/dev/null || echo "deleted"`
Expected: "deleted"

- [ ] **Step 4: Verify CSS tokens compile**

Run: `grep -c "teal-950" app/globals.css`
Expected: `3` (in :root dark, @theme inline, and extended palette)

- [ ] **Step 5: Final commit if any touch-ups needed**

```bash
git add -A
git commit -m "chore: final cleanup verification"
```

(Only if there were touch-ups. Skip if everything passed cleanly.)
