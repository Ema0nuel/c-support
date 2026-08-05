"use client";

interface ProgressDotsProps {
  currentStep: number;
  totalSteps: number;
}

/**
 * C-Support — Onboarding Progress Indicator
 *
 * Animated bar-based progress indicator at the top of the onboarding flow.
 *
 * Emil Kowalski: "Use CSS transitions over keyframes for interruptible UI.
 * CSS transitions can be interrupted and retargeted mid-animation.
 * Keyframes restart from zero."
 *
 * This component uses CSS transitions exclusively — no Framer Motion.
 * The step pills transition width and background-color via CSS.
 * The progress bar uses a CSS transition on width.
 */

export function ProgressDots({ currentStep, totalSteps }: ProgressDotsProps) {
  const progress = totalSteps > 0 ? (currentStep / totalSteps) * 100 : 0;

  return (
    <div className="w-full px-6 pt-4 pb-2 sm:px-8">
      {/* Overall progress bar — CSS transition on width */}
      <div className="mb-3 h-1 w-full overflow-hidden rounded-full bg-border/50">
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Step indicators — CSS transitions for width and color.
          Emil: "Transitions retarget smoothly when interrupted." */}
      <div
        className="flex items-center gap-1.5"
        role="progressbar"
        aria-valuenow={currentStep}
        aria-valuemin={0}
        aria-valuemax={totalSteps}
        aria-label={`Step ${currentStep} of ${totalSteps}`}
      >
        {Array.from({ length: totalSteps }).map((_, i) => {
          const stepNum = i + 1;
          const isActive = stepNum === currentStep;
          const isCompleted = stepNum < currentStep;
          return (
            <div
              key={i}
              className="h-1.5 rounded-full transition-[width,background-color] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)]"
              style={{
                width: isActive ? 20 : 6,
                backgroundColor: isActive
                  ? "var(--primary)"
                  : isCompleted
                    ? "var(--primary-light, var(--primary))"
                    : "var(--border)",
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
