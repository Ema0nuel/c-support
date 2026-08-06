"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useAgentStore } from "@/store/agent";
import { useOnboardingStore } from "@/store/onboarding";
import { cn } from "@/lib/utils";
import { BusinessTab } from "./business-tab";
import { AgentTab } from "./agent-tab";

/**
 * C-Support — Settings Panel
 *
 * Full settings view with Business / Agent sub-tabs.
 * Reads from both Zustand stores. Writes back on edit.
 * Replaces the old static SettingsView in dashboard.tsx.
 */

type SettingsTab = "business" | "agent";

const TABS: { id: SettingsTab; label: string }[] = [
  { id: "business", label: "Business" },
  { id: "agent", label: "Agent" },
];

export function SettingsPanel() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("business");

  const agentHydrated = useAgentStore((s) => s._hasHydrated);
  const onboardingHydrated = useOnboardingStore((s) => s._hasHydrated);

  if (!agentHydrated || !onboardingHydrated) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex items-center gap-3 text-muted-foreground">
          <span className="cs-loader h-5 w-5 rounded-full border-2 border-border border-t-primary" />
          <span className="text-sm">Loading settings…</span>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", bounce: 0, duration: 0.4 }}
    >
      {/* Tab header — pill toggle */}
      <div className="mb-6 flex rounded-lg border border-border bg-muted p-1">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "relative flex-1 rounded-md px-4 py-2 text-sm font-medium",
              "transition-[background-color,box-shadow,color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]",
              activeTab === tab.id
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "business" && <BusinessTab />}
      {activeTab === "agent" && <AgentTab />}
    </motion.div>
  );
}
