"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CustomizeNav } from "../customize-nav";
import { AgentAvatar } from "../agent-icons";
import { AVATARS, nextPath, prevPath } from "@/lib/agent";
import { useAgentStore } from "@/store/agent";
import { useOnboardingStore } from "@/store/onboarding";
import { cn } from "@/lib/utils";

/**
 * Customize Step 4 — Avatar
 *
 * Six custom SVG faces. Selecting one updates the live header preview
 * above the grid so the agent visibly "takes shape" as the owner clicks.
 */
export function StepAvatar() {
  const router = useRouter();

  const avatarId = useAgentStore((s) => s.avatarId);
  const agentName = useAgentStore((s) => s.agentName);
  const updateField = useAgentStore((s) => s.updateField);

  const businessName = useOnboardingStore((s) => s.businessName);

  const [selectedId, setSelectedId] = useState(avatarId || "spark");

  const handleSelect = (id: string) => {
    setSelectedId(id);
    updateField("avatarId", id);
  };

  const handleContinue = () => {
    updateField("avatarId", selectedId);
    router.push(nextPath("avatar")!);
  };

  return (
    <div className="flex flex-1 flex-col px-6 py-8 sm:px-8">
      <div className="flex flex-1 flex-col justify-center">
        {/* Header */}
        <h2 className="mb-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Give your agent a face
        </h2>

        <p className="mb-6 text-sm text-muted-foreground">
          Pick an identity customers will see beside every reply.
        </p>

        {/* Live preview — chat header */}
        <div className="mb-5 flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
          <AgentAvatar avatarId={selectedId} size="lg" />
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-foreground">
              {agentName.trim() || "Your agent"}
            </p>
            <p className="text-sm text-muted-foreground">
              {businessName.trim() || "Your business"} · Online
            </p>
          </div>
        </div>

        {/* Avatar grid */}
        <div className="grid grid-cols-3 gap-3">
          {AVATARS.map((a) => {
            const isSelected = selectedId === a.id;
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => handleSelect(a.id)}
                aria-pressed={isSelected}
                aria-label={`Use the ${a.label} avatar`}
                className={cn(
                  "group relative flex flex-col items-center gap-2.5 rounded-xl border p-3 pt-4",
                  "transition-[border-color,background-color,box-shadow,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]",
                  "active:scale-[0.97]",
                  isSelected
                    ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/30"
                    : "border-border bg-card hover:border-primary/30 hover:bg-muted/40"
                )}
              >
                {/* Selected check */}
                {isSelected && (
                  <span className="absolute -right-1.5 -top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-lime-400 text-teal-950 shadow-sm">
                    <svg
                      viewBox="0 0 16 16"
                      fill="none"
                      className="h-3 w-3"
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
                )}
                <AgentAvatar
                  avatarId={a.id}
                  size="lg"
                  className={cn(
                    "transition-transform duration-150",
                    isSelected ? "scale-105" : "group-hover:scale-105"
                  )}
                />
                <span
                  className={cn(
                    "text-sm font-medium",
                    isSelected ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {a.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Navigation */}
      <div>
        <CustomizeNav backHref={prevPath("avatar")} onContinue={handleContinue} />
      </div>
    </div>
  );
}
