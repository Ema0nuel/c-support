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
| teal-950 | #024B41 | Background — page, surfaces, nav, footers |
| lime-400 | #B8DE72 | Accent — highlights, badges, active states, CTAs |
| white | #FFFFFF | Text — primary text color on dark backgrounds |

### Extended

| Token | Hex | Use |
|-------|-----|-----|
| teal-600 | #0D9488 | Secondary buttons, links |
| teal-100 | #CCFBF1 | Light teal — tags, borders, muted text on dark |
| lime-500 | #A3E635 | Button hover state |
| lime-600 | #65A30D | Text on lime backgrounds |
| gray-400 | #9CA3AF | Placeholder text |
| gray-500 | #6B7280 | Secondary text |

### Semantic Tokens

| Token | Value | Use |
|-------|-------|-----|
| --background | #024B41 | Page background (always dark) |
| --foreground | #FFFFFF | Primary text |
| --primary | #B8DE72 | Accent color (lime-400) |
| --primary-foreground | #024B41 | Text on primary accent |
| --card | #0B5046 | Card/surface background (teal-tinted) |
| --card-foreground | #FFFFFF | Text on cards |
| --muted | #1A3C37 | Muted background, input fields |
| --muted-foreground | #9CA3AF | Secondary text, placeholders |
| --border | #1A3C37 | Borders, dividers |
| --ring | #B8DE72 | Focus ring color |

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
| Ghost | transparent | white | none | teal-800 |

### Cards

- Background: bg-card (#0B5046, teal-tinted)
- Border: border-border (#1A3C37, 1px)
- Radius: rounded-lg (8px)
- Shadow: shadow-sm

### Inputs

- Background: bg-muted (#1A3C37)
- Border: border-border (#1A3C37, 1px)
- Radius: rounded-md (6px)
- Focus ring: 2px ring color

### Badges

- Background: teal-50
- Text: teal-950
- Radius: rounded-full
- Padding: px-2.5 py-0.5

## Dark Mode

- **Always-dark** — the app renders the dark palette at all times, regardless of system `prefers-color-scheme`
- Single `:root` token block in `globals.css` carries the dark values (teal-950 `#024B41` background, lime-400 `#B8DE72` primary, white text)
- `@custom-variant dark (&:is(.dark *));` enables Tailwind's `dark:` variants for any future conditional styling
- The `<html>` element carries a permanent `dark` class (set in `app/layout.tsx`)
- No `@media (prefers-color-scheme)` block — the dark palette is the only palette
- All surfaces use semantic tokens (`bg-card` → `#0B5046` teal-tinted, `bg-muted` → `#1A3C37`, `bg-background` → `#024B41`); raw `bg-white` is never used

## Do / Don't

### Do
- Use teal-950 for page background and primary surfaces
- Use lime-400 for accent highlights, CTAs, and active states
- Use bg-card (#0B5046) for card/surface backgrounds (teal-tinted, not white)
- Maintain generous whitespace between sections
- Use semantic tokens (--primary, --card, --muted) not raw hex values
- Keep typography hierarchy clear (size + weight differentiation)

### Don't
- Use raw bg-white for any surface — always use bg-card or bg-muted
- Use lime for large background areas (it's an accent, not a base)
- Use more than 2 brand colors per screen
- Add gradients, decorative patterns, or unnecessary shadows
- Use shadows beyond the defined scale (shadow-sm/md/lg)
- Hardcode hex values in components — always use Tailwind theme tokens
