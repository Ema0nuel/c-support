# Dashboard & Chat Interface — Design Spec

> **Date:** 2026-08-06
> **Status:** Approved
> **Scope:** Dashboard view (current tab) + Chat interface (new tab)

---

## 1. Overview

After agent creation, the user lands on a **dashboard** in the current tab and can **launch the agent** which opens a full chat experience in a new browser tab. The dashboard is a management/monitoring surface; the chat is a standalone customer-support conversation interface.

### Architecture Decision

**Approach A: Standalone Dashboard + New-Tab Chat** — two separate UIs sharing the same design system and Zustand stores. The dashboard stays open for monitoring while the chat runs in its own tab.

---

## 2. Dashboard

### 2.1 Layout — Desktop (sidebar)

The sidebar has 3 tabs. "Conversations" in this phase shows a simple list of recent conversations (title + timestamp) pulled from localStorage — clicking one does nothing yet (future: open that conversation in the chat tab). "Settings" is a placeholder with agent name, personality, and an "Edit" link back to `/customize/name`.

```
┌──────────┬──────────────────────────────────────┐
│          │  Dashboard              [Launch Agent]│
│  C-S     │                                      │
│          │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ │
│ Dashboard│  │Convos │ │Msgs  │ │Resp  │ │Satis │ │
│ Conver-  │  │  12   │ │  87  │ │ 1.2s │ │ 94%  │ │
│ sations  │  └──────┘ └──────┘ └──────┘ └──────┘ │
│ Settings │                                      │
│          │  ┌─────────────────┬─────────────────┐│
│ ──────── │  │ Agent Config    │ Recent Activity  ││
│ ┌──────┐ │  │ Personality:    │ ● New conv start ││
│ │ glyph│ │  │   Professional  │   2 min ago      ││
│ │ Agent│ │  │ Industry:       │ ○ Resolved query ││
│ │Active│ │  │   E-commerce    │   15 min ago     ││
│ └──────┘ │  │ Knowledge:      │ ○ KB updated     ││
│          │  │   [Refunds]...  │   1 hour ago     ││
└──────────┴  └─────────────────┴─────────────────┘│
```

- **Sidebar:** Glass material (`backdrop-filter: blur(24px) saturate(180%)`), `#0B5046` at 60% opacity base
- **Brand:** `CSupportMark` SVG (chat bubble with three dots) — already exists in `agent-icons.tsx`
- **Nav items (3):** Dashboard (active), Conversations, Settings — each with hand-drawn SVG icons (2.5px rounded strokes, matching `step-icons.tsx` grammar)
- **Agent mini-card:** Shows the chosen `AgentAvatar` SVG glyph on lime tile, "Active" status dot, no name clutter
- **Content area:** 4 stat cards → 2-column grid (Agent Config + Activity Feed)

### 2.2 Layout — Mobile (bottom island navbar)

```
┌───────────────────────┐
│  Dashboard    [Launch]│
│  Monitor your agent   │
│                       │
│  ┌──────┐  ┌──────┐  │
│  │Convos│  │ Msgs │  │
│  │  12  │  │  87  │  │
│  └──────┘  └──────┘  │
│  ┌──────┐  ┌──────┐  │
│  │ Resp │  │ Satis│  │
│  │ 1.2s │  │ 94%  │  │
│  └──────┘  └──────┘  │
│                       │
│  ┌─────────────────┐  │
│  │ Recent Activity │  │
│  │ ● New conv  2m  │  │
│  └─────────────────┘  │
│                       │
│  ╭───────────────────╮│
│  │ 📊  💬  ⚙️        ││  ← glass pill navbar
│  │ Dash Chats Set    ││
│  ╰───────────────────╯│
└───────────────────────┘
```

- **Bottom island:** Glass pill shape, 3 tabs (Dashboard, Chats, Settings), active state gets lime-tinted background capsule
- **Stats:** Collapsed to 2x2 grid
- **Activity:** Compact single-line items

### 2.3 Stats Data

Stats are computed from localStorage conversation data:

| Stat | Source | Format |
|------|--------|--------|
| Conversations | Count of entries in `c-support-conversations` | Integer |
| Messages | Sum of all message counts across conversations | Integer |
| Avg Response | Average time between user message and agent response | Seconds (1 decimal) |
| Satisfaction | Placeholder for future — defaults to 94% | Percentage |

### 2.4 Agent Configuration Panel

Reads from Zustand stores (agent + onboarding):

| Row | Source | Display |
|-----|--------|---------|
| Personality | `agent.personalityId` → `personalityById()` | Label text |
| Industry | `onboarding.businessNiche` | Label text |
| Knowledge | `agent.enabledCategories[]` | Pill badges (max 3 visible, +N overflow) |

"Edit" link navigates back to `/customize/name`.

### 2.5 Activity Feed

Reads from localStorage conversations. Shows last 3-5 entries:

| Field | Source |
|-------|--------|
| Event text | Derived from first message content (truncated) |
| Timestamp | Relative time ("2 min ago", "1 hour ago") |
| Status dot | Lime = recent (< 5 min), dim = older |

---

## 3. Chat Interface (New Tab)

### 3.1 Route & Entry

- **Route:** `/chat` (existing)
- **Entry:** `window.open("/chat", "_blank")` from dashboard "Launch Agent" button
- **Hydration gate:** Wait for both `onboarding._hasHydrated` and `agent._hasHydrated` before rendering

### 3.2 Layout — Desktop

```
┌──────────────────────────────────────────────┐
│ [glyph] Agent          Online · Test mode  ✕ │  ← glass top bar
├──────────────────────────────────────────────┤
│                                              │
│          ┌──────────────────────┐            │
│          │  [large avatar]      │            │
│          │  How can I help      │            │  ← empty state
│          │  your customers?     │            │
│          └──────────────────────┘            │
│                                              │
│  ╭─────────────────────────────────────────╮ │
│  │ Type a message...              [send]   │ │  ← glass composer
│  ╰─────────────────────────────────────────╯ │
│           Powered by C-Support AI            │
└──────────────────────────────────────────────┘
```

### 3.3 Layout — Active Conversation

```
┌──────────────────────────────────────────────┐
│ [glyph] Agent          Online · Test mode  ✕ │
├──────────────────────────────────────────────┤
│                                              │
│ [glyph] ┌─ Hello! Welcome to TechStore... ┐  │  ← agent bubble
│         └─────────────────────────────────┘  │
│                                              │
│        ┌─ I ordered a laptop last week... ─┐ │  ← user bubble
│        └───────────────────────────────────┘ │
│                                              │
│ [glyph] ┌─ I understand your concern...   ┐  │  ← agent response
│         │  [copy] [regenerate]              │  │  ← hover actions
│         └──────────────────────────────────┘  │
│                                              │
│        ┌─ I placed it 3 days ago ─────────┐ │
│        └───────────────────────────────────┘ │
│                                              │
│ [glyph] ┌─ ● ● ● ────────────────────────┐  │  ← typing indicator
│         └──────────────────────────────────┘  │
│                                              │
│  ╭─────────────────────────────────────────╮ │
│  │ Type a message...              [send]   │ │
│  ╰─────────────────────────────────────────╯ │
└──────────────────────────────────────────────┘
```

### 3.4 Message Bubbles

**Agent bubbles:**
- Left-aligned, prefixed with `AgentAvatar` glyph (24px on desktop, 20px on mobile)
- Background: `rgba(11,80,70,0.5)` (your `#0B5046` at 50%)
- Border: `1px solid rgba(23,96,85,0.4)` (your `#176055` at 40%)
- Radius: `12px` with `border-top-left-radius: 4px` (speech-bubble flat corner)
- Text: `rgba(255,255,255,0.85)`, `13px`, `line-height: 1.5`

**User bubbles:**
- Right-aligned, no avatar prefix
- Background: `#B8DE72` (your lime primary)
- Text: `#024B41` (your deep teal), `font-weight: 500`
- Radius: `12px` with `border-top-right-radius: 4px`

**Hover actions (agent messages only, last message):**
- Copy + Regenerate icons in `24px` rounded squares
- Background: `rgba(2,75,65,0.5)`
- Default opacity: `0`, transitions to `1` on bubble hover
- Only shown on the most recent assistant message

### 3.5 Send Button Icon

A proper send arrow SVG (not upload/arrow-up):

```svg
<svg viewBox="0 0 20 20" fill="none">
  <path d="M3.5 10L17 3L10 17L9 11L3.5 10Z" fill="#024B41" stroke="#024B41" stroke-width="1" stroke-linejoin="round"/>
</svg>
```

This is the classic "paper plane" send icon — a filled triangle pointing up-right. Clean, recognizable, no ambiguity.

### 3.6 Typing Indicator

Three dots using the existing `typing-bounce` keyframe from `globals.css`:
- Dot 1: `animation-delay: 0s`
- Dot 2: `animation-delay: 0.2s`
- Dot 3: `animation-delay: 0.4s`
- Size: `5px` diameter, `rgba(169,195,188,0.3)` color

### 3.7 Empty State

Shown when no messages exist:
- Large `AgentAvatar` (64px desktop, 56px mobile) with lime glow shadow (`box-shadow: 0 8px 32px rgba(184,222,114,0.15)`)
- Welcome text: "How can I help your customers today?"
- Subtitle: "Type a message below to start a conversation"

### 3.8 Greeting Auto-Send

On mount (empty conversation), the agent's greeting from `agent.greeting` is automatically displayed as the first assistant message. No API call — it's a local display.

---

## 4. Data Layer — localStorage

### 4.1 Conversation Store

**Key:** `c-support-conversations`

```typescript
interface LocalConversation {
  id: string;              // UUID
  title: string;           // First user message (truncated to 60 chars)
  messages: LocalMessage[];
  createdAt: number;       // Date.now()
  updatedAt: number;
}

interface LocalMessage {
  id: string;              // UUID
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  responseTime?: number;   // ms between user send and agent reply
}

interface LocalConversationsData {
  conversations: LocalConversation[];
  _counter: number;        // monotonic ID for ordering
}
```

### 4.2 Chat Store (Zustand)

**Key:** `c-support-chat`

| Field | Type | Purpose |
|-------|------|---------|
| `messages` | `ChatMessage[]` | Active conversation messages |
| `conversationId` | `string \| null` | Current conversation UUID |
| `isLoading` | `boolean` | Agent is processing |
| `_hasHydrated` | `boolean` | localStorage hydration flag |

**Actions:** `addUserMessage`, `addAssistantMessage`, `setLoading`, `setConversationId`, `clearMessages`, `loadMessages`

### 4.3 Conversation Lifecycle

```
1. User opens /chat (new tab)
2. If no active conversation → show empty state
3. User sends first message →
   a. Create conversation in localStorage
   b. Generate UUID, store mapping
   c. POST to /api/chat with full context
   d. Store response
4. Subsequent messages → append to existing conversation
5. On page refresh → load last active conversation from localStorage
```

---

## 5. Animation System — "Silk Premium"

Every interaction uses the existing animation tokens from `globals.css`. No new CSS variables needed.

### 5.1 Dashboard Animations

| Element | Animation | Values |
|---------|-----------|--------|
| Page load | Staggered card entrance | `slide-up` keyframe, 50ms stagger between cards |
| Stat numbers | Count-up on mount | Framer Motion `useSpring` from 0 to target, `damping: 1.0, duration: 0.6` |
| Cards | Hover lift | `translateY(-2px)` on `@media (hover: hover) and (pointer: fine)` |
| Launch Agent button | Press feedback | `scale(0.97)` on `:active`, 150ms `--ease-out` |
| Sidebar nav items | Hover highlight | Background transition `200ms --ease-out` |
| Agent mini-card | Entry spring | Framer Motion `type: "spring", bounce: 0, duration: 0.4` |
| Activity dots | Pulse on new entry | `pulse-soft` keyframe, one cycle |

### 5.2 Chat Animations

| Element | Animation | Values |
|---------|-----------|--------|
| Message bubbles | Spring entrance | Framer Motion `type: "spring", bounce: 0, duration: 0.4`, `initial: { opacity: 0, y: 12 }` |
| Typing indicator | CSS bounce | `typing-bounce` keyframe (existing) |
| Composer | Glass entrance | `backdrop-filter` transition `300ms --ease-out` on focus |
| Send button | Press feedback | `scale(0.97)` on `:active`, 150ms |
| Hover actions | Fade in on hover | `opacity: 0 → 1`, 150ms `--ease-out` |
| Empty state avatar | Glow pulse | `box-shadow` transition on mount, subtle lime glow |
| Messages scroll | Smooth scroll | `scroll-behavior: smooth` on message container |

### 5.3 Mobile Animations

| Element | Animation | Values |
|---------|-----------|--------|
| Bottom island | Glass entrance | `translateY(100%) → translateY(0)`, 300ms `--ease-drawer` |
| Tab switch | Active capsule | `width` + `background` transition, 200ms `--ease-out` |
| Stats grid | Stagger entry | Same as desktop, 50ms stagger |
| Messages | Same as desktop | Springs, no change |

### 5.4 Animation Rules

1. **Never animate keyboard-initiated actions** — the agent text input and send do not animate on keystroke
2. **CSS for predetermined, Framer Motion for dynamic** — staggered entries use CSS keyframes; message bubbles use Framer Motion springs (interruptible)
3. **Exit animations mirror enter** — messages fade out along the same path they entered
4. **Reduced motion** — all `prefers-reduced-motion: reduce` rules from `globals.css` apply; replace springs with opacity cross-fades

---

## 6. Component Architecture

### 6.1 New Components

```
components/
├── dashboard/
│   ├── dashboard.tsx          # REWRITE — full dashboard with sidebar
│   ├── dashboard-sidebar.tsx  # Sidebar nav (desktop) / bottom island (mobile)
│   ├── dashboard-stats.tsx    # 4 stat cards with count-up animation
│   ├── dashboard-agent.tsx    # Agent Configuration panel
│   ├── dashboard-activity.tsx # Activity Feed
│   └── dashboard-layout.tsx   # Shell: sidebar + content area
├── chat/
│   ├── chat-interface.tsx     # REWRITE — full chat experience
│   ├── chat-header.tsx        # Glass top bar (agent glyph + status)
│   ├── chat-empty.tsx         # Empty state (centered avatar + welcome)
│   ├── chat-messages.tsx      # Scrollable message list
│   ├── message-bubble.tsx     # Individual bubble (agent or user)
│   ├── chat-composer.tsx      # Glass input dock + send button
│   └── typing-indicator.tsx   # Three bouncing dots
```

### 6.2 New Store

```
store/
├── onboarding.ts              # EXISTS — no changes
├── agent.ts                   # EXISTS — no changes
└── chat.ts                    # NEW — conversation + message state
```

### 6.3 New Utilities

```
lib/
├── agent.ts                   # EXISTS — add buildAgentSystemPrompt export
├── chat.ts                    # EXISTS — no changes
├── utils.ts                   # EXISTS — no changes
└── conversations.ts           # NEW — localStorage CRUD for conversations
```

### 6.4 Icon Components

All SVG icons follow the existing grammar from `step-icons.tsx` and `agent-icons.tsx`:
- 48x48 viewBox (or 20x20 for nav icons)
- 2.5px rounded strokes
- `currentColor` for main strokes
- Lime `#B8DE72` for accents

**New SVG icons needed:**
1. **Dashboard nav icon** — grid of 4 squares (2x2)
2. **Conversations nav icon** — chat bubble with tail
3. **Settings nav icon** — gear/cog
4. **Send button** — paper plane (filled triangle pointing up-right)
5. **Back arrow** — chevron left
6. **Close** — thin X
7. **Copy** — two overlapping rectangles
8. **Regenerate** — circular arrows

---

## 7. Routing Changes

| Route | Change | Notes |
|-------|--------|-------|
| `/dashboard` | REWRITE | Full dashboard with sidebar layout |
| `/chat` | REWRITE | Full chat experience with conversation persistence |

No new routes needed. The dashboard sidebar navigates between views (Dashboard, Conversations, Settings) via client-side state, not URL routes — keeping it simple.

---

## 8. What's NOT In Scope

| Feature | Status | Notes |
|---------|--------|-------|
| Conversation list page | Basic in this phase | Sidebar "Conversations" tab shows a simple list (title + timestamp) from localStorage. Clicking does nothing yet. Future: open in chat tab. |
| Settings page | Basic in this phase | Sidebar "Settings" tab — shows agent name, personality, and "Edit" link to `/customize/name`. No full settings form yet. |
| Streaming responses | Deferred | Non-streaming first, streaming can be added later |
| Search across conversations | Deferred | Future enhancement |
| Multiple agent support | Deferred | Single agent per business |
| Authentication | Deferred | Thesis artifact in FastAPI, not needed for demo |

---

## 9. File Creation/Modification Summary

### Create
- `store/chat.ts` — Zustand chat store with persist
- `lib/conversations.ts` — localStorage CRUD
- `components/dashboard/dashboard-sidebar.tsx`
- `components/dashboard/dashboard-stats.tsx`
- `components/dashboard/dashboard-agent.tsx`
- `components/dashboard/dashboard-activity.tsx`
- `components/dashboard/dashboard-layout.tsx`
- `components/chat/chat-header.tsx`
- `components/chat/chat-empty.tsx`
- `components/chat/chat-messages.tsx`
- `components/chat/message-bubble.tsx`
- `components/chat/chat-composer.tsx`
- `components/chat/typing-indicator.tsx`

### Rewrite
- `components/dashboard/dashboard.tsx`
- `components/chat/chat-interface.tsx`

### Modify
- `app/dashboard/page.tsx` — update to use new Dashboard component
- `app/chat/page.tsx` — update to use new ChatInterface component
- `app/globals.css` — add any new animation utilities if needed

---

## 10. Design Principles

1. **Your palette, no new colors** — `#024B41`, `#0B5046`, `#B8DE72`, `#1A3C37`, `#176055`, `#0E5147`, `#A9C3BC` only
2. **Your SVG icons** — hand-drawn, 2.5px strokes, no emoji, no icon libraries
3. **Glass materials** — `backdrop-filter: blur(24px) saturate(180%)` on chrome, `blur(20px)` on composer
4. **Apple fluid principles** — springs for dynamic UI, `scale(0.97)` on press, staggered entries
5. **Emil Kowalski details** — size-specific letter-spacing, unseen details compound, cohesion over decoration
6. **Reduced motion respected** — all animations gated by `prefers-reduced-motion`
7. **Mobile-first** — bottom island navbar, full-width bubbles, compact stats
