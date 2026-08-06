"use client";

import { motion } from "framer-motion";
import { SettingsRow } from "./settings-row";
import { PersonalitySelector } from "./personality-selector";
import { AvatarSelector } from "./avatar-selector";
import { ScopeChips } from "./scope-chips";
import { ResetSection } from "./reset-section";
import { useAgentStore } from "@/store/agent";
import { useOnboardingStore } from "@/store/onboarding";
import { DEFAULT_SCOPE } from "@/lib/agent";
import { Button } from "@/components/ui/button";

/**
 * C-Support — Agent Tab
 *
 * Editable agent config: name, personality, greeting, avatar, scope, handoff.
 * Each field writes to agentStore on save. Complex controls (personality,
 * avatar, scope) auto-save on selection.
 */

export function AgentTab() {
  const agentName = useAgentStore((s) => s.agentName);
  const personalityId = useAgentStore((s) => s.personalityId);
  const greeting = useAgentStore((s) => s.greeting);
  const avatarId = useAgentStore((s) => s.avatarId);
  const enabledCategories = useAgentStore((s) => s.enabledCategories);
  const handoffMessage = useAgentStore((s) => s.handoffMessage);
  const updateField = useAgentStore((s) => s.updateField);
  const setEnabledCategories = useAgentStore((s) => s.setEnabledCategories);
  const reset = useAgentStore((s) => s.reset);

  const businessName = useOnboardingStore((s) => s.businessName);

  const aiAnalysis = useOnboardingStore((s) => s.aiAnalysis);
  const sourceCategories =
    aiAnalysis?.matchedCategories && aiAnalysis.matchedCategories.length > 0
      ? aiAnalysis.matchedCategories
      : DEFAULT_SCOPE;

  const handleReset = () => {
    if (
      !window.confirm(
        "This will reset your agent's personality, greeting, and handoff to defaults. Your name and avatar will be kept. Continue?"
      )
    ) {
      return;
    }
    const keepName = agentName;
    const keepAvatar = avatarId;
    reset();
    updateField("agentName", keepName);
    updateField("avatarId", keepAvatar);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
      className="space-y-4"
    >
      {/* Agent Name */}
      <SettingsRow
        label="Agent Name"
        value={agentName}
        onSave={(v) => updateField("agentName", v)}
        placeholder="e.g. Nova Support"
        maxLength={60}
      />

      {/* Personality — card grid (auto-save) */}
      <PersonalitySelector
        selectedId={personalityId}
        agentName={agentName}
        onSelect={(id) => updateField("personalityId", id)}
      />

      {/* Greeting */}
      <SettingsRow
        label="Greeting"
        value={greeting}
        onSave={(v) => updateField("greeting", v)}
        type="textarea"
        placeholder="Hi! How can I help you today?"
        maxLength={300}
        showCount
      />

      {/* Avatar — horizontal selector (auto-save) */}
      <AvatarSelector
        selectedId={avatarId}
        agentName={agentName}
        businessName={businessName}
        onSelect={(id) => updateField("avatarId", id)}
      />

      {/* Knowledge Topics — toggle chips (auto-save) */}
      <ScopeChips
        enabledCategories={enabledCategories}
        sourceCategories={sourceCategories}
        onChange={setEnabledCategories}
      />

      {/* Handoff Message */}
      <SettingsRow
        label="Handoff Message"
        value={handoffMessage}
        onSave={(v) => updateField("handoffMessage", v)}
        type="textarea"
        placeholder="Let me connect you with a human agent..."
        maxLength={300}
        showCount
      />

      {/* Reset to defaults (agent only) */}
      <div className="pt-2">
        <Button variant="ghost" size="sm" onClick={handleReset} className="text-destructive/70 hover:text-destructive hover:bg-destructive/10">
          Reset agent to defaults
        </Button>
      </div>

      {/* Full data reset */}
      <ResetSection />
    </motion.div>
  );
}
