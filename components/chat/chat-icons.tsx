"use client";

/**
 * C-Support — Chat SVG Icons
 *
 * Hand-drawn SVG grammar matching agent-icons.tsx:
 * - stroke="currentColor", strokeWidth="1.5", strokeLinecap="round", strokeLinejoin="round"
 * - No emoji, no icon libraries
 * - All accept className prop, default color currentColor
 */

interface IconProps {
  className?: string;
}

// ═══════════════════════════════════════════════════
// Send — filled paper plane (triangle pointing up-right)
// ═══════════════════════════════════════════════════

export function SendIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M3.5 10L17 3L10 17L9 11L3.5 10Z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ═══════════════════════════════════════════════════
// Back — chevron left
// ═══════════════════════════════════════════════════

export function BackIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M12 4L6 10L12 16"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ═══════════════════════════════════════════════════
// Close — thin X
// ═══════════════════════════════════════════════════

export function CloseIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M5 5L15 15M15 5L5 15"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ═══════════════════════════════════════════════════
// Copy — two overlapping rectangles
// ═══════════════════════════════════════════════════

export function CopyIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 16 16"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <rect
        x="5"
        y="5"
        width="9"
        height="9"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M11 5V3.5C11 2.67 10.33 2 9.5 2H3.5C2.67 2 2 2.67 2 3.5V9.5C2 10.33 2.67 11 3.5 11H5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

