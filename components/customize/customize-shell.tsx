"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { usePathname } from "next/navigation";
import { CSupportMark } from "./agent-icons";
import { CustomizeProgress } from "./customize-progress";
import { CUSTOMIZE_STEPS, stepFromPath } from "@/lib/agent";
import { useAgentStore } from "@/store/agent";
import { useOnboardingStore } from "@/store/onboarding";

/**
 * C-Support — Customize Shell
 *
 * Shared chrome for the 7 routed customization steps (app/customize/*):
 * top bar (brand + business name + step count), the labeled progress
 * rail, and the scrollable content region that renders each step.
 *
 * Hydration gate mirrors components/onboarding/wizard.tsx: children are
 * not rendered until the persisted agent store has rehydrated, so steps
 * never see pre-hydration defaults.
 */
export function CustomizeShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const { visitedSteps, _hasHydrated, setHasHydrated, setVisitedStep } =
    useAgentStore();
  const businessName = useOnboardingStore((s) => s.businessName);

  // ─── Hydration (mirrors wizard.tsx) ──────────────
  useEffect(() => {
    const unsub = useAgentStore.persist.onFinishHydration(() => {
      setHasHydrated(true);
    });
    if (useAgentStore.persist.hasHydrated()) {
      setHasHydrated(true);
    }
    return unsub;
  }, [setHasHydrated]);

  // ─── Mark the current step visited once hydrated ─
  const currentStep = stepFromPath(pathname ?? "") ?? CUSTOMIZE_STEPS[0];
  const currentNum = currentStep.num;

  // ─── Direction-aware transitions ───────────────
  // The one authored focal motion on this surface: forward steps enter
  // from the right, backward steps from the left. Exit is faster than
  // entrance (animate.md: "Exit faster than entrance").
  //
  // Direction is computed in an effect (not during render) to satisfy the
  // React compiler's no-ref-in-render rule. The enter animation plays
  // after AnimatePresence finishes the exit, by which time the effect
  // has run and set the correct direction.
  const [forward, setForward] = useState(true);
  const prevPathnameRef = useRef(pathname);

  useEffect(() => {
    if (pathname !== prevPathnameRef.current) {
      const prevStep =
        stepFromPath(prevPathnameRef.current ?? "") ?? CUSTOMIZE_STEPS[0];
      setForward(currentNum >= prevStep.num);
      prevPathnameRef.current = pathname;
    }
  }, [pathname, currentNum]);

  // Easing tuple — framer's Easing type, not `as const`.
  const EASE: [number, number, number, number] = [0.23, 1, 0.32, 1];

  const stepVariants: Variants = {
    enter: (dir: boolean) => ({
      x: dir ? 32 : -32,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: boolean) => ({
      x: dir ? -20 : 20,
      opacity: 0,
    }),
  };

  useEffect(() => {
    if (currentNum) setVisitedStep(currentNum);
  }, [currentNum, setVisitedStep]);

  // ─── Loading gate ────────────────────────────────
  if (!_hasHydrated) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="h-8 w-8 animate-spin-css rounded-full border-2 border-primary/20 border-t-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col">
      {/* ─── Top bar ──────────────────────────────── */}
      <header className="flex items-center justify-between px-6 pt-5 sm:px-8">
        <div className="flex items-center gap-3">
          <CSupportMark className="h-9 w-9 shrink-0" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">
              {businessName.trim() || "Your business"}
            </p>
            <p className="text-xs text-muted-foreground">Agent setup</p>
          </div>
        </div>
        <p className="shrink-0 text-xs font-medium text-muted-foreground">
          Step {currentNum} of {CUSTOMIZE_STEPS.length}
        </p>
      </header>

      {/* ─── Progress rail ────────────────────────── */}
      <CustomizeProgress currentStep={currentNum} visitedSteps={visitedSteps} />

      {/* ─── Step content ───────────────────────────
          AnimatePresence keyed on pathname. Direction comes from
          whether the step number increased (forward) or decreased (back).
          Enter is slightly longer than exit — animate.md: "Exit faster." */}
      <div className="onboarding-scroll flex flex-1 flex-col">
        <AnimatePresence mode="wait" initial={false} custom={forward}>
          <motion.div
            key={pathname}
            custom={forward}
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "tween", duration: 0.2, ease: EASE },
              opacity: { duration: 0.15, ease: EASE },
            }}
            className="flex flex-1 flex-col"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
