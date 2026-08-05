"use client";

import { useRouter } from "next/navigation";
import { CUSTOMIZE_STEPS, TOTAL_CUSTOMIZE_STEPS } from "@/lib/agent";
import { cn } from "@/lib/utils";

/**
 * C-Support — Customize Progress Rail
 *
 * Labeled step rail for the 7 routed customization steps.
 * Follows progress-dots.tsx philosophy: CSS transitions only (no
 * Framer Motion) so states retarget smoothly when interrupted.
 *
 * - Visited steps render as clickable links (router.push).
 * - Current step is highlighted with the primary pill.
 * - Future steps are muted and not clickable.
 */
export function CustomizeProgress({
  currentStep,
  visitedSteps,
}: {
  currentStep: number;
  visitedSteps: number[];
}) {
  const router = useRouter();

  return (
    <div className="w-full px-6 pt-4 pb-2 sm:px-8">
      {/* Overall progress bar — CSS transition on width */}
      <div className="mb-4 h-1 w-full overflow-hidden rounded-full bg-border/50">
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]"
          style={{ width: `${(currentStep / TOTAL_CUSTOMIZE_STEPS) * 100}%` }}
        />
      </div>

      {/* Step pills */}
      <nav
        aria-label="Agent customization progress"
        className="onboarding-scroll -mx-6 flex gap-2 overflow-x-auto px-6 pb-1 sm:-mx-8 sm:px-8"
      >
        {CUSTOMIZE_STEPS.map((step) => {
          const isCurrent = step.num === currentStep;
          const isVisited = visitedSteps.includes(step.num);
          const isClickable = isVisited || isCurrent;

          return (
            <button
              key={step.id}
              type="button"
              disabled={!isClickable}
              onClick={() => isClickable && router.push(step.path)}
              aria-current={isCurrent ? "step" : undefined}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium",
                "transition-[background-color,border-color,color,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]",
                "active:scale-[0.97]",
                isCurrent &&
                  "border-lime-500 bg-primary text-primary-foreground shadow-sm shadow-black/5",
                !isCurrent &&
                  isVisited &&
                  "border-primary/20 bg-primary/5 text-primary hover:border-primary/40 hover:bg-primary/10",
                !isCurrent &&
                  !isVisited &&
                  "border-border text-muted-foreground disabled:pointer-events-none"
              )}
            >
              {/* Step number chip */}
              <span
                className={cn(
                  "flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold",
                  isCurrent
                    ? "bg-lime-400 text-teal-950"
                    : isVisited
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                )}
              >
                {step.num}
              </span>
              {step.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
