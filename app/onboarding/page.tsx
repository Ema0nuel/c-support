import type { Metadata } from "next";
import { Wizard } from "@/components/onboarding/wizard";
import { ReducedMotionProvider } from "@/components/reduced-motion-provider";

export const metadata: Metadata = {
  title: "Onboarding — C-Support",
  description: "Set up your AI-powered customer support agent.",
};

/**
 * Onboarding Page
 *
 * Full-screen wizard for business setup.
 * Redirects to / on completion (see Step 5).
 *
 * Wrapped in ReducedMotionProvider so Framer Motion respects
 * `prefers-reduced-motion` — springs/transforms get replaced with
 * instant opacity changes for users who prefer reduced motion.
 */
export default function OnboardingPage() {
  return (
    <main className="flex min-h-screen flex-col bg-background">
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col">
        <ReducedMotionProvider>
          <Wizard />
        </ReducedMotionProvider>
      </div>
    </main>
  );
}
