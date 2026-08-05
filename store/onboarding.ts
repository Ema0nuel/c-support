/**
 * C-Support — Onboarding Store (Zustand)
 *
 * Manages the multi-step onboarding flow state.
 * Persisted to localStorage via Zustand's persist middleware.
 *
 * Follows fitmate's store/onboarding-store.ts pattern exactly.
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface AIAnalysis {
  matchedCategories: string[];
  systemPrompt: string;
  summary: string;
  suggestedPolicies: { category: string; description: string }[];
}

interface OnboardingState {
  currentStep: number;
  completedSteps: number[];

  // Step data
  businessName: string;
  businessNiche: string;
  customNiche: string;
  businessOrigin: string;

  // Step 4
  policiesInput: string;
  policiesSource: "upload" | "paste" | null;
  aiAnalysis: AIAnalysis | null;
  isAnalyzing: boolean;

  // Completion
  isComplete: boolean;

  // Hydration
  _hasHydrated: boolean;

  // Actions
  setCurrentStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  updateField: (field: string, value: string) => void;
  setAiAnalysis: (analysis: AIAnalysis | null) => void;
  setAnalyzing: (v: boolean) => void;
  setPoliciesSource: (source: "upload" | "paste") => void;
  markComplete: () => void;
  reset: () => void;
  setHasHydrated: (value: boolean) => void;
}

export const TOTAL_STEPS = 5;

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      currentStep: 1,
      completedSteps: [],

      businessName: "",
      businessNiche: "",
      customNiche: "",
      businessOrigin: "",

      policiesInput: "",
      policiesSource: null,
      aiAnalysis: null,
      isAnalyzing: false,

      isComplete: false,
      _hasHydrated: false,

      setCurrentStep: (step: number) =>
        set({ currentStep: Math.max(1, Math.min(step, TOTAL_STEPS)) }),

      nextStep: () =>
        set((state) => ({
          currentStep: Math.min(state.currentStep + 1, TOTAL_STEPS),
          completedSteps: state.completedSteps.includes(state.currentStep)
            ? state.completedSteps
            : [...state.completedSteps, state.currentStep],
        })),

      prevStep: () =>
        set((state) => ({
          currentStep: Math.max(state.currentStep - 1, 1),
        })),

      updateField: (field, value) =>
        set({ [field]: value } as Partial<OnboardingState>),

      setAiAnalysis: (analysis) => set({ aiAnalysis: analysis }),

      setAnalyzing: (v) => set({ isAnalyzing: v }),

      setPoliciesSource: (source) => set({ policiesSource: source }),

      markComplete: () =>
        set({
          isComplete: true,
          completedSteps: [1, 2, 3, 4, 5],
        }),

      reset: () =>
        set({
          currentStep: 1,
          completedSteps: [],
          businessName: "",
          businessNiche: "",
          customNiche: "",
          businessOrigin: "",
          policiesInput: "",
          policiesSource: null,
          aiAnalysis: null,
          isAnalyzing: false,
          isComplete: false,
        }),

      setHasHydrated: (value) => set({ _hasHydrated: value }),
    }),
    {
      name: "c-support-onboarding",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        currentStep: state.currentStep,
        completedSteps: state.completedSteps,
        businessName: state.businessName,
        businessNiche: state.businessNiche,
        customNiche: state.customNiche,
        businessOrigin: state.businessOrigin,
        policiesInput: state.policiesInput,
        policiesSource: state.policiesSource,
        aiAnalysis: state.aiAnalysis,
        isComplete: state.isComplete,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
