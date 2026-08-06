"use client";

/**
 * C-Support — Dashboard SVG Icons
 *
 * Hand-drawn icons following the project's SVG grammar:
 * - viewBox="0 0 20 20" for nav icons
 * - stroke="currentColor", strokeWidth="1.5", strokeLinecap="round", strokeLinejoin="round"
 * - No emoji, no icon libraries
 */

interface IconProps {
  className?: string;
}

// ═══════════════════════════════════════════════════
// Dashboard — 2×2 grid of rounded squares
// ═══════════════════════════════════════════════════

export function DashboardIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <rect
        x="2.5"
        y="2.5"
        width="6.5"
        height="6.5"
        rx="1.8"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <rect
        x="11"
        y="2.5"
        width="6.5"
        height="6.5"
        rx="1.8"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <rect
        x="2.5"
        y="11"
        width="6.5"
        height="6.5"
        rx="1.8"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <rect
        x="11"
        y="11"
        width="6.5"
        height="6.5"
        rx="1.8"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  );
}

// ═══════════════════════════════════════════════════
// Conversations — chat bubble with tail
// ═══════════════════════════════════════════════════

export function ConversationsIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M3.5 13.5V5.5C3.5 4.12 4.62 3 6 3H14C15.38 3 16.5 4.12 16.5 5.5V11.5C16.5 12.88 15.38 14 14 14H8L4.5 16.5V14H4C3.72 14 3.5 13.78 3.5 13.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <line x1="7" y1="7.5" x2="13" y2="7.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="7" y1="10.5" x2="11" y2="10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

// ═══════════════════════════════════════════════════
// Settings — gear/cog with 8 teeth
// ═══════════════════════════════════════════════════

export function SettingsIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <circle
        cx="10"
        cy="10"
        r="3"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M10 1.5L11.2 3.8L13.8 3.2L13.5 5.8L16.1 7L14.4 9L16.1 11L13.5 12.2L13.8 14.8L11.2 14.2L10 16.5L8.8 14.2L6.2 14.8L6.5 12.2L3.9 11L5.6 9L3.9 7L6.5 5.8L6.2 3.2L8.8 3.8Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ═══════════════════════════════════════════════════
// Send — paper plane (filled triangle pointing up-right)
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
