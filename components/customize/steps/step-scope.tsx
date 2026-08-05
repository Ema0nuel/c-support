"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CustomizeNav } from "../customize-nav";
import { DEFAULT_SCOPE, nextPath, prevPath } from "@/lib/agent";
import { useAgentStore } from "@/store/agent";
import { useOnboardingStore } from "@/store/onboarding";
import { cn } from "@/lib/utils";

/**
 * Customize Step 5 — Scope (Knowledge)
 *
 * The owner defines what topics the agent is allowed to handle.
 * Toggle chips are seeded from the onboarding AI analysis
 * (aiAnalysis.matchedCategories) when available, else a sensible
 * default scope. Everything starts enabled — the owner trims it down.
 */
export function StepScope() {
  const router = useRouter();

  const agentName = useAgentStore((s) => s.agentName);
  const enabledCategories = useAgentStore((s) => s.enabledCategories);
  const setEnabledCategories = useAgentStore((s) => s.setEnabledCategories);

  const aiAnalysis = useOnboardingStore((s) => s.aiAnalysis);

  const analysisCategories = aiAnalysis?.matchedCategories ?? [];
  const sourceCategories =
    analysisCategories.length > 0 ? analysisCategories : DEFAULT_SCOPE;

  const [enabled, setEnabled] = useState<string[]>(
    enabledCategories.length > 0 ? enabledCategories : sourceCategories
  );

  const isAllEnabled = enabled.length === sourceCategories.length;

  const toggle = (category: string) => {
    setEnabled((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const handleContinue = () => {
    setEnabledCategories(enabled);
    router.push(nextPath("scope")!);
  };

  return (
    <div className="flex flex-1 flex-col px-6 py-8 sm:px-8">
      <div className="flex flex-1 flex-col justify-center">
        {/* Header */}
        <h2 className="mb-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          What can {agentName.trim() || "your agent"} help with?
        </h2>

        <p className="mb-6 text-sm text-muted-foreground">
          Toggle the topics your agent is allowed to handle. Everything else
          triggers a graceful handoff.
        </p>

        {/* Count + select-all row */}
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{enabled.length}</span>{" "}
            of {sourceCategories.length} topics enabled
          </p>
          <button
            type="button"
            onClick={() =>
              setEnabled(isAllEnabled ? [] : [...sourceCategories])
            }
            className="text-sm font-medium text-primary transition-colors hover:text-primary/80"
          >
            {isAllEnabled ? "Disable all" : "Enable all"}
          </button>
        </div>

        {/* Toggle chips */}
        <div className="flex flex-wrap gap-2">
          {sourceCategories.map((category) => {
            const isOn = enabled.includes(category);
            return (
              <button
                key={category}
                type="button"
                onClick={() => toggle(category)}
                aria-pressed={isOn}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-medium",
                  "transition-[border-color,background-color,color,box-shadow,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]",
                  "active:scale-[0.97]",
                  isOn
                    ? "border-primary bg-primary text-primary-foreground shadow-sm"
                    : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
                )}
              >
                {category}
                <span
                  className={cn(
                    "flex h-4 w-4 items-center justify-center rounded-full border transition-colors duration-150",
                    isOn
                      ? "border-lime-400 bg-lime-400 text-teal-950"
                      : "border-border bg-muted text-transparent"
                  )}
                >
                  <svg
                    viewBox="0 0 16 16"
                    fill="none"
                    className="h-2.5 w-2.5"
                    aria-hidden="true"
                  >
                    <path
                      d="M3 8.5l3 3 7-7"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </button>
            );
          })}
        </div>

        {/* Out-of-scope explainer */}
        <div className="mt-5 rounded-2xl border border-border bg-card p-4 shadow-sm">
          <p className="mb-1 text-sm font-semibold text-foreground">
            Out-of-scope questions
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Anything outside these topics won&apos;t be guessed at. The agent
            uses the handoff message you write next, so customers always reach
            a human when it matters.
          </p>
        </div>
      </div>

      {/* Navigation */}
      <div>
        <CustomizeNav backHref={prevPath("scope")} onContinue={handleContinue} />
      </div>
    </div>
  );
}
