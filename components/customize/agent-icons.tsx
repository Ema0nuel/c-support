"use client";

import { cn } from "@/lib/utils";

/**
 * C-Support — Agent Avatar Glyphs
 *
 * Six custom SVG marks for the agent's avatar. Each is drawn in the
 * same grammar as onboarding's step-icons.tsx: 48x48 viewBox, 2.5px
 * rounded strokes. Main strokes use `currentColor` (inherits the tile
 * text color), accents are fixed lime (#B8DE72) — so the glyph reads
 * correctly on any background the AgentAvatar tile sets.
 *
 * No emoji. No icon libraries.
 */

interface GlyphProps {
  className?: string;
}

// ═══════════════════════════════════════════════════
// Spark — four-point sparkle with a lime core
// ═══════════════════════════════════════════════════

export function SparkGlyph({ className }: GlyphProps) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
      <path
        d="M24 8 C25.5 17 31 22.5 40 24 C31 25.5 25.5 31 24 40 C22.5 31 17 25.5 8 24 C17 22.5 22.5 17 24 8 Z"
        fill="currentColor"
      />
      <circle cx="24" cy="24" r="3.5" fill="#B8DE72" />
    </svg>
  );
}

// ═══════════════════════════════════════════════════
// Hex — hexagon with a friendly face
// ═══════════════════════════════════════════════════

export function HexGlyph({ className }: GlyphProps) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
      <path
        d="M24 7 L40 16 L40 32 L24 41 L8 32 L8 16 Z"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <circle cx="17" cy="22" r="2.4" fill="#B8DE72" />
      <circle cx="31" cy="22" r="2.4" fill="#B8DE72" />
      <path
        d="M17 30 Q24 36 31 30"
        stroke="#B8DE72"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

// ═══════════════════════════════════════════════════
// Orbit — a ring with a travelling node
// ═══════════════════════════════════════════════════

export function OrbitGlyph({ className }: GlyphProps) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
      <circle cx="24" cy="24" r="15" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="24" cy="9" r="4.5" fill="#B8DE72" />
      <circle cx="36" cy="30" r="2" fill="currentColor" opacity="0.4" />
    </svg>
  );
}

// ═══════════════════════════════════════════════════
// Bolt — responsive bolt with a spark accent
// ═══════════════════════════════════════════════════

export function BoltGlyph({ className }: GlyphProps) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
      <path
        d="M28 6 L12 28 L21 28 L18 42 L36 19 L26 19 Z"
        fill="currentColor"
        strokeLinejoin="round"
      />
      <circle cx="31" cy="14" r="2.6" fill="#B8DE72" />
    </svg>
  );
}

// ═══════════════════════════════════════════════════
// Wave — chat bubble echoing the C-Support mark
// ═══════════════════════════════════════════════════

export function WaveGlyph({ className }: GlyphProps) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
      <path
        d="M13 16 C13 12.5 15.5 10 19 10 H29 C32.5 10 35 12.5 35 16 V22 C35 25.5 32.5 28 29 28 H25 L21 32 V28 H19 C15.5 28 13 25.5 13 22 Z"
        fill="currentColor"
      />
      <circle cx="19" cy="21" r="2.2" fill="#B8DE72" />
      <circle cx="24" cy="21" r="2.2" fill="#B8DE72" />
      <circle cx="29" cy="21" r="2.2" fill="#B8DE72" />
    </svg>
  );
}

// ═══════════════════════════════════════════════════
// Frame — rounded frame with a fixed core
// ═══════════════════════════════════════════════════

export function FrameGlyph({ className }: GlyphProps) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
      <rect
        x="11"
        y="11"
        width="26"
        height="26"
        rx="8"
        stroke="currentColor"
        strokeWidth="2.5"
      />
      <circle cx="24" cy="24" r="5" fill="#B8DE72" />
      <circle cx="34" cy="14" r="2" fill="currentColor" />
    </svg>
  );
}

const AVATAR_GLYPHS: Record<string, (props: GlyphProps) => React.ReactNode> = {
  spark: SparkGlyph,
  hex: HexGlyph,
  orbit: OrbitGlyph,
  bolt: BoltGlyph,
  wave: WaveGlyph,
  frame: FrameGlyph,
};

// ═══════════════════════════════════════════════════
// AgentAvatar — the agent's face (tile + glyph)
// ═══════════════════════════════════════════════════

export type AgentAvatarSize = "sm" | "md" | "lg" | "xl";

const AVATAR_SIZE_CLASSES: Record<AgentAvatarSize, string> = {
  sm: "h-8 w-8 rounded-lg",
  md: "h-10 w-10 rounded-xl",
  lg: "h-14 w-14 rounded-2xl",
  xl: "h-20 w-20 rounded-2xl",
};

export function AgentAvatar({
  avatarId,
  size = "md",
  className,
}: {
  avatarId: string;
  size?: AgentAvatarSize;
  className?: string;
}) {
  const Glyph = AVATAR_GLYPHS[avatarId] ?? SparkGlyph;
  return (
    <div
      className={cn(
        "inline-flex shrink-0 items-center justify-center bg-primary text-primary-foreground shadow-sm shadow-black/10",
        AVATAR_SIZE_CLASSES[size],
        className
      )}
      aria-hidden="true"
    >
      <Glyph className="h-[62%] w-[62%]" />
    </div>
  );
}

// ═══════════════════════════════════════════════════
// CSupportMark — brand mark for top bars
// ═══════════════════════════════════════════════════

export function CSupportMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      className={className}
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
  );
}

