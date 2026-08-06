"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { SettingsRow } from "./settings-row";
import { PoliciesSection } from "./policies-section";
import { Input } from "@/components/ui/input";
import { useOnboardingStore } from "@/store/onboarding";
import { cn } from "@/lib/utils";

/**
 * C-Support — Business Tab
 *
 * Editable business info: name, industry, origin, policies.
 * Each field writes to onboardingStore on save.
 */

const NICHES = [
  "E-commerce & Retail",
  "Telecommunications",
  "SaaS & Technology",
  "Healthcare",
  "Finance & Banking",
  "Education",
  "Travel & Hospitality",
  "Food & Beverage",
  "Other",
];

export function BusinessTab() {
  const businessName = useOnboardingStore((s) => s.businessName);
  const businessNiche = useOnboardingStore((s) => s.businessNiche);
  const customNiche = useOnboardingStore((s) => s.customNiche);
  const businessOrigin = useOnboardingStore((s) => s.businessOrigin);
  const updateField = useOnboardingStore((s) => s.updateField);

  const displayNiche = businessNiche === "Other" ? customNiche : businessNiche;
  const [customInput, setCustomInput] = useState(customNiche);

  const handleNicheSelect = (niche: string) => {
    updateField("businessNiche", niche);
    if (niche !== "Other") {
      updateField("customNiche", "");
    }
  };

  const handleCustomNicheSave = () => {
    updateField("customNiche", customInput.trim());
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
      className="space-y-4"
    >
      {/* Business Name */}
      <SettingsRow
        label="Business Name"
        value={businessName}
        onSave={(v) => updateField("businessName", v)}
        placeholder="e.g. Acme Corp"
        maxLength={100}
      />

      {/* Industry — card grid (auto-save on select) */}
      <div className="rounded-xl border border-border bg-card px-4 py-4">
        <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Industry
        </p>
        <div className="grid grid-cols-3 gap-2">
          {NICHES.map((niche) => (
            <button
              key={niche}
              type="button"
              onClick={() => handleNicheSelect(niche)}
              className={cn(
                "rounded-lg border px-3 py-2 text-xs font-medium",
                "transition-[border-color,background-color,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]",
                "active:scale-[0.98] will-change-transform",
                businessNiche === niche
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-background text-foreground hover:border-primary/30"
              )}
            >
              {niche}
            </button>
          ))}
        </div>

        {/* Custom input for "Other" */}
        <div
          className="mt-3 grid transition-[grid-template-rows,opacity] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)]"
          style={{
            gridTemplateRows: businessNiche === "Other" ? "1fr" : "0fr",
            opacity: businessNiche === "Other" ? 1 : 0,
          }}
        >
          <div className="overflow-hidden">
            <Input
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              onBlur={handleCustomNicheSave}
              placeholder="e.g. Logistics & Supply Chain"
              className="text-sm"
            />
          </div>
        </div>
      </div>

      {/* About / Business Origin */}
      <SettingsRow
        label="About Your Business"
        value={businessOrigin}
        onSave={(v) => updateField("businessOrigin", v)}
        type="textarea"
        placeholder="Tell us about your company, its mission, and what makes it unique..."
        maxLength={2000}
        showCount
      />

      {/* Policies & Knowledge Base */}
      <PoliciesSection />
    </motion.div>
  );
}
