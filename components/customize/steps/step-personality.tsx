"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { CustomizeNav } from "../customize-nav";
import { AgentAvatar } from "../agent-icons";
import { PERSONALITIES, personalityById, nextPath, prevPath } from "@/lib/agent";
import { useAgentStore } from "@/store/agent";
import { cn } from "@/lib/utils";

/**
 * Customize Step 2 — Personality
 *
 * Four tone cards. Selecting one updates a live sample response below
 * (the same question, answered in that voice) so the choice feels real.
 */
export function StepPersonality() {
  const router = useRouter();

  const personalityId = useAgentStore((s) => s.personalityId);
  const agentName = useAgentStore((s) => s.agentName);
  const updateField = useAgentStore((s) => s.updateField);

  const [selectedId, setSelectedId] = useState(personalityId || "professional");

  const selected = personalityById(selectedId) ?? PERSONALITIES[0];

  const handleSelect = (id: string) => {
    setSelectedId(id);
    updateField("personalityId", id);
  };

  const handleContinue = () => {
    updateField("personalityId", selectedId);
    router.push(nextPath("personality")!);
  };

  return (
    <div className="flex flex-1 flex-col px-6 py-8 sm:px-8">
      <div className="flex flex-1 flex-col justify-center">
        {/* Header */}
        <h2 className="mb-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          How should {agentName.trim() || "your agent"} sound?
        </h2>

        <p className="mb-6 text-sm text-muted-foreground">
          The tone shapes every reply. Try one — the preview below updates
          instantly.
        </p>

        {/* Tone cards — 2x2 grid */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {PERSONALITIES.map((p) => {
            const isSelected = selectedId === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handleSelect(p.id)}
                aria-pressed={isSelected}
                className={cn(
                  "group rounded-xl border p-4 text-left",
                  "transition-[border-color,background-color,box-shadow,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]",
                  "active:scale-[0.98]",
                  isSelected
                    ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/30"
                    : "border-border bg-card hover:border-primary/30 hover:bg-muted/40"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-foreground">
                    {p.label}
                  </span>
                  {/* Radio indicator */}
                  <span
                    className={cn(
                      "flex h-4 w-4 items-center justify-center rounded-full border transition-colors duration-150",
                      isSelected
                        ? "border-primary bg-primary"
                        : "border-muted-foreground/40"
                    )}
                  >
                    {isSelected && (
                      <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground" />
                    )}
                  </span>
                </div>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {p.description}
                </p>
              </button>
            );
          })}
        </div>

        {/* Live preview — same question, this voice */}
        <div className="mt-6 rounded-2xl border border-border bg-card p-4 shadow-sm">
          <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Preview · “Where is my refund?”
          </p>
          <div className="flex items-start gap-3">
            <AgentAvatar avatarId="spark" size="sm" />
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedId}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                className="rounded-xl rounded-tl-sm bg-muted px-4 py-2.5 text-sm leading-relaxed text-foreground"
              >
                {selected.sample}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div>
        <CustomizeNav backHref={prevPath("personality")} onContinue={handleContinue} />
      </div>
    </div>
  );
}
