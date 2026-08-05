/**
 * C-Support — Agent Customization Store (Zustand)
 *
 * Manages the 7-step agent customization flow state.
 * Persisted to localStorage via Zustand's persist middleware.
 *
 * Follows store/onboarding.ts pattern exactly:
 * - persist + createJSONStorage(localStorage)
 * - partialize to persist only data (not actions/hydration flag)
 * - onRehydrateStorage sets _hasHydrated
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface AgentState {
  // Step 1 — Agent Name
  agentName: string;
  // Step 2 — Personality
  personalityId: string;
  // Step 3 — Greeting
  greeting: string;
  // Step 4 — Avatar
  avatarId: string;
  // Step 5 — Scope / Knowledge
  enabledCategories: string[];
  // Step 6 — Human handoff
  handoffMessage: string;
  // Step 7 — Completion
  isComplete: boolean;

  // Navigation — unlocked rail steps (1-based)
  visitedSteps: number[];

  // Hydration
  _hasHydrated: boolean;

  // Actions
  updateField: (field: keyof Omit<
    AgentState,
    "visitedSteps" | "_hasHydrated" | "isComplete"
  >, value: string) => void;
  setEnabledCategories: (categories: string[]) => void;
  setVisitedStep: (num: number) => void;
  markComplete: () => void;
  reset: () => void;
  setHasHydrated: (value: boolean) => void;
}

const INITIAL_VISITED: number[] = [1];

export const useAgentStore = create<AgentState>()(
  persist(
    (set) => ({
      agentName: "",
      personalityId: "professional",
      greeting: "",
      avatarId: "spark",
      enabledCategories: [],
      handoffMessage: "",
      isComplete: false,
      visitedSteps: INITIAL_VISITED,
      _hasHydrated: false,

      updateField: (field, value) =>
        set({ [field]: value } as Partial<AgentState>),

      setEnabledCategories: (categories) =>
        set({ enabledCategories: categories }),

      setVisitedStep: (num) =>
        set((state) =>
          state.visitedSteps.includes(num)
            ? {}
            : { visitedSteps: [...state.visitedSteps, num].sort((a, b) => a - b) }
        ),

      markComplete: () => set({ isComplete: true }),

      reset: () =>
        set({
          agentName: "",
          personalityId: "professional",
          greeting: "",
          avatarId: "spark",
          enabledCategories: [],
          handoffMessage: "",
          isComplete: false,
          visitedSteps: INITIAL_VISITED,
        }),

      setHasHydrated: (value) => set({ _hasHydrated: value }),
    }),
    {
      name: "c-support-agent",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        agentName: state.agentName,
        personalityId: state.personalityId,
        greeting: state.greeting,
        avatarId: state.avatarId,
        enabledCategories: state.enabledCategories,
        handoffMessage: state.handoffMessage,
        isComplete: state.isComplete,
        visitedSteps: state.visitedSteps,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
