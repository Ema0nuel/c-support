"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { AgentAvatar } from "../agent-icons";
import { CustomizeNav } from "../customize-nav";
import { Input } from "@/components/ui/input";
import { nextPath, prevPath } from "@/lib/agent";
import { useAgentStore } from "@/store/agent";
import { useOnboardingStore } from "@/store/onboarding";

/**
 * Customize Step 1 — Agent Name
 *
 * The agent's identity. Shows a live avatar + name preview, a one-click
 * suggestion derived from the business name, and validation (2–60 chars).
 */
export function StepAgentName() {
  const router = useRouter();

  const agentName = useAgentStore((s) => s.agentName);
  const updateField = useAgentStore((s) => s.updateField);

  const businessName = useOnboardingStore((s) => s.businessName);

  const [value, setValue] = useState(agentName);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => inputRef.current?.focus(), 350);
    return () => clearTimeout(timer);
  }, []);

  const suggestion = businessName.trim()
    ? `${businessName.trim()} Assistant`
    : "Support Assistant";

  const handleContinue = () => {
    const trimmed = value.trim();
    if (!trimmed) {
      setError("Give your agent a name");
      return;
    }
    if (trimmed.length < 2) {
      setError("Names need at least 2 characters");
      return;
    }
    if (trimmed.length > 60) {
      setError("Keep the name under 60 characters");
      return;
    }
    updateField("agentName", trimmed);
    router.push(nextPath("name")!);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleContinue();
  };

  return (
    <div className="flex flex-1 flex-col px-6 py-8 sm:px-8">
      <div className="flex flex-1 flex-col justify-center">
        {/* Live preview — the agent takes shape.
            One authored moment on this step: the spring "birth" of the
            agent tile. Everything else enters with the step itself. */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 16 }}
          className="mb-8 flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm"
        >
          <AgentAvatar avatarId="spark" size="lg" />
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-foreground">
              {value.trim() || "Your agent's name"}
            </p>
            <p className="text-sm text-muted-foreground">
              {businessName.trim() || "Your business"} · Support agent
            </p>
          </div>
        </motion.div>

        {/* Header */}
        <h2 className="mb-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Name your support agent
        </h2>

        <p className="mb-6 text-sm text-muted-foreground">
          This is the name customers will see — a friendly identity that
          represents your business.
        </p>

        {/* Input */}
        <div>
          <Input
            ref={inputRef}
            id="agent-name"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setError("");
            }}
            onKeyDown={handleKeyDown}
            placeholder="e.g. Nova Support"
            maxLength={60}
            error={error}
            autoComplete="off"
          />

          {/* Suggested name — one click to apply */}
          <button
            type="button"
            onClick={() => {
              setValue(suggestion);
              setError("");
              inputRef.current?.focus();
            }}
            className="mt-3 inline-flex items-center gap-1.5 text-sm text-primary transition-colors hover:text-primary/80"
          >
            <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-primary/10">
              <svg
                viewBox="0 0 16 16"
                fill="none"
                className="h-2.5 w-2.5 text-primary"
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
            Use suggestion: {suggestion}
          </button>
        </div>
      </div>

      {/* Navigation */}
      <div>
        <CustomizeNav backHref={prevPath("name")} onContinue={handleContinue} />
      </div>
    </div>
  );
}
