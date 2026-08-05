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
