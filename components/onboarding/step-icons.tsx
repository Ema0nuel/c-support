"use client";

/**
 * C-Support — Onboarding Step Icons
 *
 * Custom SVG icons for each onboarding step. Each icon has a unique
 * design that communicates its step's purpose at a glance.
 *
 * All icons use the C-Support palette (#024B41 teal / #B8DE72 lime)
 * with rounded strokes. No emoji. No icon libraries.
 *
 * Designed for 48x48 container (w-12 h-12) with 2.5px strokes.
 */

// ═══════════════════════════════════════════════════
// Step 1 — Business Name: Storefront with identity
// ═══════════════════════════════════════════════════

export function BusinessNameIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      {/* Storefront roof */}
      <path
        d="M8 18L24 8L40 18"
        stroke="#024B41"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Storefront body */}
      <rect
        x="10"
        y="18"
        width="28"
        height="22"
        rx="2"
        stroke="#024B41"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Door */}
      <rect
        x="20"
        y="28"
        width="8"
        height="12"
        rx="1"
        stroke="#B8DE72"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Identity spark — diamond */}
      <path
        d="M37 10l1.5 3 3 1.5-3 1.5L37 19l-1.5-3-3-1.5 3-1.5z"
        fill="#B8DE72"
        opacity="0.8"
      />
    </svg>
  );
}

// ═══════════════════════════════════════════════════
// Step 2 — Business Niche: Industry grid with nodes
// ═══════════════════════════════════════════════════

export function BusinessNicheIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      {/* Grid lines */}
      <line x1="16" y1="8" x2="16" y2="40" stroke="#024B41" strokeWidth="2" strokeLinecap="round" opacity="0.3" />
      <line x1="32" y1="8" x2="32" y2="40" stroke="#024B41" strokeWidth="2" strokeLinecap="round" opacity="0.3" />
      <line x1="8" y1="16" x2="40" y2="16" stroke="#024B41" strokeWidth="2" strokeLinecap="round" opacity="0.3" />
      <line x1="8" y1="32" x2="40" y2="32" stroke="#024B41" strokeWidth="2" strokeLinecap="round" opacity="0.3" />
      {/* Category nodes */}
      <circle cx="16" cy="16" r="4" stroke="#024B41" strokeWidth="2.5" />
      <circle cx="32" cy="16" r="4" stroke="#024B41" strokeWidth="2.5" />
      <circle cx="16" cy="32" r="4" fill="#B8DE72" stroke="#024B41" strokeWidth="2" />
      <circle cx="32" cy="32" r="4" stroke="#024B41" strokeWidth="2.5" />
      {/* Center highlight */}
      <circle cx="24" cy="24" r="3" fill="#024B41" />
    </svg>
  );
}

// ═══════════════════════════════════════════════════
// Step 3 — Business Origin: Building with narrative
// ═══════════════════════════════════════════════════

export function BusinessOriginIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      {/* Building */}
      <rect
        x="12"
        y="14"
        width="24"
        height="26"
        rx="2"
        stroke="#024B41"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Roof accent */}
      <path
        d="M10 14L24 6L38 14"
        stroke="#024B41"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Windows */}
      <rect x="16" y="18" width="5" height="5" rx="1" stroke="#B8DE72" strokeWidth="1.5" />
      <rect x="27" y="18" width="5" height="5" rx="1" stroke="#B8DE72" strokeWidth="1.5" />
      <rect x="16" y="27" width="5" height="5" rx="1" stroke="#B8DE72" strokeWidth="1.5" />
      <rect x="27" y="27" width="5" height="5" rx="1" stroke="#B8DE72" strokeWidth="1.5" />
      {/* Door */}
      <rect
        x="20"
        y="34"
        width="8"
        height="6"
        rx="1"
        stroke="#024B41"
        strokeWidth="2"
      />
      {/* Growth line */}
      <path
        d="M6 38 Q12 30 18 34 Q24 38 30 26 Q36 14 42 10"
        stroke="#B8DE72"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.6"
      />
    </svg>
  );
}

// ═══════════════════════════════════════════════════
// Step 4 — Business Policies: Document with analysis
// ═══════════════════════════════════════════════════

export function BusinessPoliciesIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      {/* Document */}
      <rect
        x="10"
        y="6"
        width="22"
        height="30"
        rx="2"
        stroke="#024B41"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Document lines */}
      <line x1="15" y1="14" x2="27" y2="14" stroke="#B8DE72" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="15" y1="20" x2="27" y2="20" stroke="#B8DE72" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="15" y1="26" x2="22" y2="26" stroke="#B8DE72" strokeWidth="1.5" strokeLinecap="round" />
      {/* Analysis lens */}
      <circle cx="34" cy="30" r="8" stroke="#024B41" strokeWidth="2.5" />
      <line x1="40" y1="36" x2="44" y2="42" stroke="#024B41" strokeWidth="2.5" strokeLinecap="round" />
      {/* Check inside lens */}
      <path
        d="M30 30 L33 33 L38 27"
        stroke="#B8DE72"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ═══════════════════════════════════════════════════
// Step 5 — Review: Shield with checkmark
// ═══════════════════════════════════════════════════

export function ReviewIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      {/* Shield */}
      <path
        d="M24 4L8 12V24C8 34 16 42 24 44C32 42 40 34 40 24V12L24 4Z"
        stroke="#024B41"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Shield inner */}
      <path
        d="M24 8L12 14V24C12 32 18 38 24 40C30 38 36 32 36 24V14L24 8Z"
        fill="#B8DE72"
        opacity="0.15"
      />
      {/* Checkmark */}
      <path
        d="M16 24L22 30L32 18"
        stroke="#024B41"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
