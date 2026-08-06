"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useOnboardingStore } from "@/store/onboarding";

/**
 * C-Support — Onboarding Guard
 *
 * Wraps any protected page. If the business setup onboarding
 * hasn't been completed, redirects to /onboarding.
 *
 * Checks:
 * 1. Zustand has hydrated from localStorage
 * 2. Onboarding isComplete === true
 *
 * Pages that should NOT use this guard:
 * - /onboarding (the page it redirects TO)
 * - /api/* (server routes)
 *
 * Pages that already have their own redirect logic:
 * - / (home page redirects to /dashboard when complete)
 */
export function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const isComplete = useOnboardingStore((s) => s.isComplete);
  const hydrated = useOnboardingStore((s) => s._hasHydrated);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    // Wait for Zustand to hydrate from localStorage
    if (!hydrated) return;

    if (isComplete) {
      setAllowed(true);
    } else {
      // Onboarding not complete — redirect
      router.replace("/onboarding");
    }
  }, [hydrated, isComplete, router]);

  // Still hydrating — show minimal loading state
  if (!hydrated || !allowed) {
    return (
      <div className="flex flex-1 items-center justify-center bg-zinc-950">
        <div className="flex items-center gap-3 text-zinc-400">
          <span className="cs-loader h-5 w-5 rounded-full border-2 border-zinc-700 border-t-lime-400" />
          <span className="text-sm">Loading…</span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
