"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAgentStore } from "@/store/agent";

/**
 * C-Support — Home Page
 *
 * If the agent is already configured (isComplete + has a name),
 * automatically redirect to /dashboard. Otherwise show the landing page.
 *
 * Emil Kowalski: "Rare/first-time (onboarding, celebrations) → Can add delight."
 * Uses CSS @keyframes for GPU-accelerated entrance (not Framer Motion).
 * CTA button has tactile press via .btn-press class — no entrance animation
 * because the button will be used repeatedly.
 */
export default function Home() {
  const isComplete = useAgentStore((s) => s.isComplete);
  const agentName = useAgentStore((s) => s.agentName);
  const hydrated = useAgentStore((s) => s._hasHydrated);
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    if (hydrated && isComplete && agentName.trim()) {
      setRedirecting(true);
      // Small delay so the user sees the redirect state
      const t = setTimeout(() => {
        window.location.href = "/dashboard";
      }, 300);
      return () => clearTimeout(t);
    }
  }, [hydrated, isComplete, agentName]);

  // Redirecting state
  if (redirecting) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center bg-teal-950 px-6">
        <div className="flex items-center gap-3 text-teal-100">
          <span className="cs-loader h-5 w-5 rounded-full border-2 border-teal-600 border-t-lime-400" />
          <span className="text-sm">Opening your dashboard…</span>
        </div>
      </div>
    );
  }

  // Still hydrating — show nothing (will redirect or show landing)
  if (!hydrated) {
    return (
      <div className="flex flex-1 items-center justify-center bg-teal-950">
        <span className="cs-loader h-5 w-5 rounded-full border-2 border-teal-600 border-t-lime-400" />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-teal-950 px-6">
      <main className="flex flex-col items-center text-center">
        {/* Logo Mark — entrance with staggered delay via animation-delay */}
        <div
          className="mb-8 h-16 w-16 animate-slide-up"
          style={{ animationDelay: "0ms" }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 64 64"
            fill="none"
            className="h-full w-full"
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
        </div>

        {/* Title — staggered entrance */}
        <h1
          className="animate-slide-up text-4xl font-semibold tracking-tight text-white"
          style={{ animationDelay: "80ms" }}
        >
          C-Support
        </h1>

        {/* Tagline — staggered entrance */}
        <p
          className="animate-slide-up mt-2 text-lg text-teal-100"
          style={{ animationDelay: "140ms" }}
        >
          AI-Powered Customer Support System
        </p>

        {/* CTA Button — no entrance animation (repeated use).
            Tactile press via .btn-press. Hover lift on fine pointer. */}
        <Link
          href="/onboarding"
          className="btn-press hover-lift mt-8 inline-flex items-center rounded-lg bg-lime-400 px-8 py-3 font-medium text-teal-950 transition-colors duration-150 hover:bg-lime-500"
        >
          Get Started
        </Link>
      </main>

      {/* Footer — mt-auto keeps it at bottom without absolute positioning.
          Impeccable: "absolute bottom-8 breaks on short viewports and mobile." */}
      <footer className="mt-auto pb-8 pt-16">
        <p className="text-sm text-teal-600">
          C-Support
        </p>
      </footer>
    </div>
  );
}
