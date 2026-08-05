"use client";

import { useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ProgressDots } from "./progress-dots";
import { StepBusinessName } from "./steps/step-business-name";
import { StepBusinessNiche } from "./steps/step-business-niche";
import { StepBusinessOrigin } from "./steps/step-business-origin";
import { StepBusinessPolicies } from "./steps/step-business-policies";
import { StepReview } from "./steps/step-review";
import { useOnboardingStore, TOTAL_STEPS } from "@/store/onboarding";

/**
 * C-Support — Onboarding Wizard Container
 *
 * Orchestrates the 5-step onboarding flow:
 * 1. Business Name
 * 2. Business Niche
 * 3. Business Origin
 * 4. Business Policies (file upload + AI analysis)
 * 5. Review & Launch
 *
 * Follows fitmate's onboarding-flow.tsx pattern exactly:
 * - Top progress bar
 * - AnimatePresence mode="wait" for step transitions
 * - Zustand store for state management
 * - Hydration gate for SSR safety
 */
export function Wizard() {
  const {
    currentStep,
    businessName,
    businessNiche,
    customNiche,
    businessOrigin,
    _hasHydrated,
    setHasHydrated,
    nextStep,
    prevStep,
    updateField,
  } = useOnboardingStore();

  // ─── Hydration ────────────────────────────────────
  useEffect(() => {
    // Zustand persist middleware handles hydration;
    // we just mark when it's done.
    const unsub = useOnboardingStore.persist.onFinishHydration(() => {
      setHasHydrated(true);
    });
    // If already hydrated (e.g., SSR skip), set immediately
    if (useOnboardingStore.persist.hasHydrated()) {
      setHasHydrated(true);
    }
    return unsub;
  }, [setHasHydrated]);

  // ─── Step 4 special: listen for "policies-ready" ──
  const handlePoliciesReady = useCallback(() => {
    nextStep();
  }, [nextStep]);

  useEffect(() => {
    window.addEventListener("onboarding:policies-ready", handlePoliciesReady);
    return () =>
      window.removeEventListener("onboarding:policies-ready", handlePoliciesReady);
  }, [handlePoliciesReady]);

  // ─── Step handlers ────────────────────────────────
  const handleStep1Next = (name: string) => {
    updateField("businessName", name);
    nextStep();
  };

  const handleStep2Next = (niche: string, custom: string) => {
    updateField("businessNiche", niche);
    updateField("customNiche", custom);
    nextStep();
  };

  const handleStep3Next = (origin: string) => {
    updateField("businessOrigin", origin);
    nextStep();
  };

  // ─── Loading gate ─────────────────────────────────
  if (!_hasHydrated) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-4"
        >
          {/* CSS-only spinner — not Framer Motion.
              Emil: "CSS animations run off the main thread." */}
          <div className="h-8 w-8 animate-spin-css rounded-full border-2 border-primary/20 border-t-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </motion.div>
      </div>
    );
  }

  // ─── Render step ──────────────────────────────────
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <StepBusinessName
            name={businessName}
            onNext={handleStep1Next}
            onBack={prevStep}
          />
        );
      case 2:
        return (
          <StepBusinessNiche
            niche={businessNiche}
            customNiche={customNiche}
            onNext={handleStep2Next}
            onBack={prevStep}
          />
        );
      case 3:
        return (
          <StepBusinessOrigin
            origin={businessOrigin}
            onNext={handleStep3Next}
            onBack={prevStep}
          />
        );
      case 4:
        return <StepBusinessPolicies onBack={prevStep} />;
      case 5:
        return <StepReview />;
      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-full flex-col">
      {/* Progress bar */}
      <ProgressDots currentStep={currentStep} totalSteps={TOTAL_STEPS} />

      {/* Step content — AnimatePresence enables exit animations.
          Emil: "AnimatePresence mode='wait' ensures the exiting element
          finishes before the entering element begins — no overlap." */}
      <div className="onboarding-scroll flex flex-1 flex-col">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            className="flex flex-1 flex-col"
            initial={{ opacity: 0, transform: "translateX(40px)" }}
            animate={{ opacity: 1, transform: "translateX(0)" }}
            exit={{ opacity: 0, transform: "translateX(-40px)" }}
            transition={{
              duration: 0.25,
              ease: [0.23, 1, 0.32, 1],
            }}
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
