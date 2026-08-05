# C-Support: Cleanup & Rebranding Design Spec

**Date:** 2026-08-05
**Author:** Claude Code + emas0
**Status:** Approved
**Approach:** Token-First (Option A)

---

## 1. Objective

Remove all `create-next-app` default content and establish C-Support's visual identity with a complete design token system, minimal splash page, and project documentation.

## 2. Scope

### In Scope
- Delete all default Next.js assets (SVGs, favicon)
- Replace `globals.css` with full brand token system
- Update `layout.tsx` metadata
- Build minimal splash page (`page.tsx`)
- Create `lib/utils.ts` with `cn()` helper
- Write `DESIGN.md` (visual system document)
- Replace `README.md` with project-specific content
- Create SVG favicon

### Out of Scope
- Navigation bar or app shell
- Onboarding flow
- Chat UI
- API routes
- Database setup
- Component library (Radix + CVA components)
- Dark mode UI (tokens defined, no dark-mode-specific components yet)

---

## 3. Design Tokens

### 3.1 Primary Palette

| Token | Hex | Role |
|-------|-----|------|
| `teal-950` | `#024B41` | Primary — headers, CTAs, nav, footers |
| `lime-400` | `#B8DE72` | Accent — highlights, badges, active states |
| `white` | `#FFFFFF` | Base — backgrounds, cards, content areas |

### 3.2 Extended Palette

| Token | Hex | Role |
|-------|-----|------|
| `teal-50` | `#F0FDF9` | Subtle teal background, hover states |
| `teal-100` | `#CCFBF1` | Light teal — tags, borders |
| `teal-600` | `#0D9488` | Secondary buttons, links |
| `teal-800` | `#115E59` | Text on light backgrounds |
| `lime-100` | `#ECFCCB` | Success backgrounds |
| `lime-600` | `#65A30D` | Text on lime backgrounds |
| `gray-50` | `#F9FAFB` | Page background (light mode) |
| `gray-100` | `#F3F4F6` | Card borders, dividers |
| `gray-500` | `#6B7280` | Secondary text |
| `gray-900` | `#111827` | Primary text |

### 3.3 Semantic Tokens (CSS Custom Properties)

```css
/* Light Mode */
--background: #F9FAFB;          /* gray-50 */
--foreground: #111827;          /* gray-900 */
--primary: #024B41;             /* teal-950 */
--primary-foreground: #FFFFFF;  /* white */
--accent: #B8DE72;              /* lime-400 */
--accent-foreground: #024B41;   /* teal-950 */
--muted: #F3F4F6;               /* gray-100 */
--muted-foreground: #6B7280;    /* gray-500 */
--border: #E5E7EB;
--ring: #024B41;                /* teal-950 */

/* Dark Mode */
--background: #024B41;          /* teal-950 */
--foreground: #FFFFFF;          /* white */
--primary: #B8DE72;             /* lime-400 */
--primary-foreground: #024B41;  /* teal-950 */
--accent: #024B41;              /* teal-950 */
--accent-foreground: #FFFFFF;   /* white */
--muted: #1A3C37;               /* teal-900ish */
--muted-foreground: #9CA3AF;    /* gray-400 */
--border: #1A3C37;
--ring: #B8DE72;                /* lime-400 */
```

### 3.4 Typography

- **Font stack:** Geist Sans (`--font-geist-sans`) for all UI text
- **Mono:** Geist Mono (`--font-geist-mono`) for code/data values
- **Scale:** Tailwind defaults — `text-xs` (12px) through `text-4xl` (36px)
- **Weights:** `font-normal` (400) body, `font-medium` (500) buttons/labels, `font-semibold` (600) headings, `font-bold` (700) display

### 3.5 Spacing & Radius

- **Spacing:** Tailwind 4px increment scale (p-1 = 4px, p-2 = 8px, etc.)
- **Border radius:** `rounded-md` (6px) buttons/inputs, `rounded-lg` (8px) cards/modals, `rounded-full` badges/avatars
- **Shadows:** `shadow-sm` subtle lift, `shadow-md` cards, `shadow-lg` modals/dropdowns

---

## 4. Splash Page

### 4.1 Layout

Vertically centered, single column, `max-w-md` (448px).

```
┌─────────────────────────────────────────────┐
│                                             │
│                                             │
│              ┌─────────┐                    │
│              │  Logo/  │                    │
│              │  Icon   │                    │
│              └─────────┘                    │
│                                             │
│            C - S u p p o r t                │
│    AI-Powered Customer Support System       │
│                                             │
│         ┌──────────────────┐                │
│         │   Get Started    │                │
│         └──────────────────┘                │
│                                             │
│                                             │
│              C-Support                      │
│                                             │
└─────────────────────────────────────────────┘
```

### 4.2 Element Specs

| Element | Implementation |
|---------|---------------|
| **Background** | `bg-white` (light mode), `bg-teal-950` (dark mode) |
| **Logo** | Inline SVG — teal square with rounded corners, lime chat bubble silhouette inside. ~64x64px. |
| **Title** | "C-Support" — `text-4xl font-semibold tracking-tight text-gray-900` |
| **Tagline** | "AI-Powered Customer Support System" — `text-lg text-gray-500 mt-2` |
| **CTA Button** | "Get Started" — `bg-lime-400 text-teal-950 rounded-lg px-8 py-3 font-medium hover:bg-lime-500 transition-colors` |
| **Footer** | "C-Support" — `text-sm text-gray-400 mt-12` |

### 4.3 Interaction

- CTA button links to `/onboarding` (route not built yet — just the href)
- Hover state: lime darkens to `lime-500` (`#A3E635`)
- Active state: slight scale down (`scale-[0.98]`)
- No entrance animations — instant render

### 4.4 Dark Mode

- Background switches to `bg-teal-950`
- Title becomes `text-white`
- Tagline becomes `text-teal-100`
- Button stays lime (same)
- Footer becomes `text-teal-600`

---

## 5. Documentation

### 5.1 DESIGN.md

Location: Project root (`DESIGN.md`)

Sections:
1. **Brand Identity** — name, voice ("professional, helpful, concise"), tone ("neutral, factual"), visual personality ("clean, trustworthy, research-grade")
2. **Color Palette** — full token tables from Section 3
3. **Typography** — font stack, scale, weights, usage rules
4. **Spacing & Layout** — grid (not yet defined — single column for now), spacing scale, radius, shadows
5. **Component Tokens** — button variants (primary/lime, secondary/teal, ghost), card styles, input styles, badge styles
6. **Dark Mode Strategy** — system preference detection, token inversion
7. **Do / Don't** — visual guardrails:
   - Do: Use teal for primary actions, lime for accent/highlights
   - Don't: Use lime for large background areas, use more than 2 colors per screen
   - Do: Maintain generous whitespace
   - Don't: Add gradients, shadows beyond the defined scale, or decorative elements

### 5.2 README.md

Location: Project root (`README.md`)

Sections:
1. Project name + description
2. Thesis title and university
3. Tech stack (table format)
4. Quick start commands
5. Directory structure
6. Development notes
7. License/academic notice

---

## 6. Cleanup Checklist

### 6.1 Files to DELETE (5 files)

- `public/file.svg`
- `public/globe.svg`
- `public/next.svg`
- `public/vercel.svg`
- `public/window.svg`

### 6.2 Files to CREATE (4 files)

| File | Content |
|------|---------|
| `lib/utils.ts` | `cn()` function using `clsx` + `tailwind-merge` |
| `DESIGN.md` | Full visual system document |
| `public/favicon.svg` | Inline SVG favicon — teal square with lime chat icon |
| `docs/superpowers/specs/2026-08-05-cleanup-rebrand-design.md` | This spec |

### 6.3 Files to MODIFY (4 files)

| File | Changes |
|------|---------|
| `app/globals.css` | Replace entire content with brand token system (CSS custom properties, `@theme inline` block, dark mode media query) |
| `app/layout.tsx` | Update `metadata.title` to "C-Support", `metadata.description` to real description |
| `app/page.tsx` | Replace entirely with minimal splash page component |
| `README.md` | Replace with project-specific content |

### 6.4 Files UNCHANGED (9 items)

- `package.json` — no new dependencies
- `tsconfig.json` — already correct
- `next.config.ts` — empty, fine
- `postcss.config.mjs` — already correct
- `eslint.config.mjs` — already correct
- `CLAUDE.md` — project reference
- `AGENTS.md` — auto-generated
- `policy/*` — training data
- `.env` — empty

---

## 7. Technical Notes

### 7.1 `cn()` Utility Pattern

```typescript
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

This is the standard shadcn/ui pattern. Every component will use `cn()` for conditional class merging.

### 7.2 Tailwind v4 Token Integration

The `globals.css` `@theme inline` block maps CSS custom properties to Tailwind utility classes:

```css
@theme inline {
  --color-teal-950: #024B41;
  --color-lime-400: #B8DE72;
  /* ... etc */
}
```

This enables `bg-teal-950`, `text-lime-400`, etc. in Tailwind classes.

### 7.3 Favicon

SVG favicon will be embedded as a `<link rel="icon" type="image/svg+xml" href="/favicon.svg" />` in `layout.tsx`. The old `.ico` file gets deleted.

---

## 8. Verification

After implementation, verify:
1. [ ] `npm run dev` starts without errors
2. [ ] Home page shows C-Support splash (not Next.js default)
3. [ ] Metadata shows "C-Support" in browser tab
4. [ ] Brand colors render correctly (teal primary, lime accent)
5. [ ] Dark mode tokens apply when system preference is dark
6. [ ] No console errors or warnings
7. [ ] `npm run build` completes successfully
8. [ ] `DESIGN.md` exists and contains full token system
9. [ ] `README.md` contains project-specific content
10. [ ] Default SVGs are deleted from `public/`
