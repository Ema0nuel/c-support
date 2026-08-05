"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { AgentAvatar } from "../agent-icons";
import {
  CUSTOMIZE_STEPS,
  personalityById,
  getDefaultGreeting,
} from "@/lib/agent";
import { useAgentStore } from "@/store/agent";
import { useOnboardingStore } from "@/store/onboarding";
import { Button } from "@/components/ui/button";

/**
 * C-Support — Customize Step 7 — Review
 *
 * Stacked card layout (same on all screen sizes).
 * A floating chat-bubble FAB opens a slide-in chat preview
 * panel from the right — same page, no new tab.
 *
 * "Create Agent" saves state, opens /chat in a new tab,
 * main tab goes to /dashboard.
 */

// ──────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────

const excerpt = (text: string, max = 80) =>
  text.length > max ? `${text.slice(0, max)}…` : text;

// ──────────────────────────────────────────────────
// SVG Icons (stroke-based, no emoji, no Lucide)
// ──────────────────────────────────────────────────

function EditIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" className={className} aria-hidden="true">
      <path
        d="M11.5 1.5l3 3L5 14H2v-3L11.5 1.5z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M18 6L6 18M6 6l12 12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ──────────────────────────────────────────────────
// StepReview — main component
// ──────────────────────────────────────────────────

export function StepReview() {
  const router = useRouter();

  const agentName = useAgentStore((s) => s.agentName);
  const personalityId = useAgentStore((s) => s.personalityId);
  const greeting = useAgentStore((s) => s.greeting);
  const avatarId = useAgentStore((s) => s.avatarId);
  const enabledCategories = useAgentStore((s) => s.enabledCategories);
  const handoffMessage = useAgentStore((s) => s.handoffMessage);
  const markComplete = useAgentStore((s) => s.markComplete);

  const businessName = useOnboardingStore((s) => s.businessName);

  const [creating, setCreating] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const personality = personalityById(personalityId);
  const initialGreeting =
    greeting.trim() || getDefaultGreeting(agentName, businessName);

  // ── Launch handler ──────────────────────────
  const handleCreate = () => {
    if (creating) return;
    setCreating(true);
    window.setTimeout(() => {
      markComplete();
      window.open("/chat", "_blank");
      router.push("/dashboard");
    }, 900);
  };

  // ── Card data ──────────────────────────────
  const summaryCards = [
    {
      id: "name",
      stepPath: CUSTOMIZE_STEPS[0].path,
      label: "Agent name",
      value: agentName.trim() || "—",
    },
    {
      id: "personality",
      stepPath: CUSTOMIZE_STEPS[1].path,
      label: "Personality",
      value: personality?.label ?? "—",
    },
    {
      id: "greeting",
      stepPath: CUSTOMIZE_STEPS[2].path,
      label: "Greeting",
      value: excerpt(greeting.trim()) || "—",
    },
    {
      id: "handoff",
      stepPath: CUSTOMIZE_STEPS[5].path,
      label: "Handoff",
      value: excerpt(handoffMessage.trim()) || "—",
    },
  ];

  return (
    <div className="flex flex-1 flex-col px-6 py-8 sm:px-8">
      {/* ══════════════════════════════════════════
           HEADER
           ══════════════════════════════════════════ */}
      <h2 className="mb-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
        Review your agent
      </h2>
      <p className="mb-6 text-sm text-muted-foreground">
        One last look before you launch. Anything can be edited from here.
      </p>

      {/* ══════════════════════════════════════════
           IDENTITY CARD
           ══════════════════════════════════════════ */}
      <div className="mb-4 flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
        <AgentAvatar avatarId={avatarId} size="lg" />
        <div className="min-w-0">
          <p className="truncate text-base font-semibold text-foreground">
            {agentName.trim() || "Your agent"}
          </p>
          <p className="text-sm text-muted-foreground">
            {businessName.trim() || "Your business"} ·{" "}
            {personality?.label ?? "Professional"}
          </p>
        </div>
      </div>

      {/* ══════════════════════════════════════════
           SUMMARY CARDS
           ══════════════════════════════════════════ */}
      <div className="space-y-2">
        {summaryCards.map((card) => (
          <div
            key={card.id}
            className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card px-4 py-3 shadow-sm"
          >
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                {card.label}
              </p>
              <p className="truncate text-sm text-foreground">{card.value}</p>
            </div>
            <button
              type="button"
              onClick={() => router.push(card.stepPath)}
              className="shrink-0 text-sm font-medium text-primary transition-colors hover:text-primary/80"
            >
              Edit
            </button>
          </div>
        ))}
      </div>

      {/* ══════════════════════════════════════════
           KNOWLEDGE BADGES
           ══════════════════════════════════════════ */}
      <div className="mt-2 flex items-center justify-between gap-4 rounded-xl border border-border bg-card px-4 py-3 shadow-sm">
        <div className="min-w-0">
          <p className="mb-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Knowledge · {enabledCategories.length} topics
          </p>
          <div className="flex flex-wrap gap-1.5">
            {enabledCategories.slice(0, 6).map((category) => (
              <span
                key={category}
                className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
              >
                {category}
              </span>
            ))}
            {enabledCategories.length > 6 && (
              <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                +{enabledCategories.length - 6}
              </span>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={() => router.push(CUSTOMIZE_STEPS[4].path)}
          className="shrink-0 text-sm font-medium text-primary transition-colors hover:text-primary/80"
        >
          Edit
        </button>
      </div>

      {/* ══════════════════════════════════════════
           CREATE AGENT BUTTON
           ══════════════════════════════════════════ */}
      <div className="mt-auto pt-6">
        <div className="relative">
          <Button
            onClick={handleCreate}
            disabled={creating}
            size="lg"
            className="w-full"
          >
            {creating ? "Creating your agent…" : "Create agent"}
          </Button>

          <AnimatePresence>
            {creating && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 z-10 flex items-center justify-center gap-2 rounded-lg bg-teal-950/90 text-lime-400 backdrop-blur-sm"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-5 w-5"
                  aria-hidden="true"
                >
                  <path
                    d="M5 12.5l4.5 4.5L19 7.5"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="text-sm font-semibold">Agent ready</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ══════════════════════════════════════════
           FLOATING CHAT BUBBLE FAB
           ══════════════════════════════════════════ */}
      <button
        type="button"
        onClick={() => setPreviewOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform duration-150 ease-[cubic-bezier(0.23,1,0.32,1)] hover:scale-105 active:scale-95 md:bottom-8 md:right-8"
        aria-label="Preview chat"
      >
        <AgentAvatar avatarId={avatarId} size="md" />
      </button>

      {/* ══════════════════════════════════════════
           CHAT PREVIEW PANEL — slides in from right
           ══════════════════════════════════════════ */}
      <AnimatePresence>
        {previewOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
              onClick={() => setPreviewOpen(false)}
            />

            {/* Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{
                type: "spring",
                damping: 28,
                stiffness: 300,
              }}
              className="fixed bottom-0 right-0 top-0 z-50 flex w-full max-w-sm flex-col border-l border-border bg-background shadow-2xl sm:bottom-20 sm:right-6 sm:top-20 sm:rounded-2xl sm:border"
            >
              {/* Panel header */}
              <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <div className="flex items-center gap-3">
                  <AgentAvatar avatarId={avatarId} size="md" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {agentName.trim() || "Your agent"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {businessName.trim() || "your business"}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  aria-label="Close preview"
                >
                  <CloseIcon className="h-4 w-4" />
                </button>
              </div>

              {/* Chat messages */}
              <div className="sandbox-scrollbar flex flex-1 flex-col gap-3 overflow-y-auto px-5 py-4">
                {/* Agent greeting */}
                <div className="flex items-start gap-2.5">
                  <AgentAvatar avatarId={avatarId} size="sm" />
                  <div className="max-w-[80%] whitespace-pre-wrap rounded-2xl rounded-tl-sm bg-muted px-3.5 py-2.5 text-sm leading-relaxed text-foreground">
                    {initialGreeting}
                  </div>
                </div>

                {/* Sample customer question */}
                <div className="flex justify-end">
                  <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-primary px-3.5 py-2.5 text-sm leading-relaxed text-primary-foreground">
                    Where is my order?
                  </div>
                </div>

                {/* Sample agent response */}
                <div className="flex items-start gap-2.5">
                  <AgentAvatar avatarId={avatarId} size="sm" />
                  <div className="max-w-[80%] whitespace-pre-wrap rounded-2xl rounded-tl-sm bg-muted px-3.5 py-2.5 text-sm leading-relaxed text-foreground">
                    {personality?.sample ?? "How can I help you today?"}
                  </div>
                </div>
              </div>

              {/* Disabled input bar */}
              <div className="border-t border-border px-5 py-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-10 flex-1 items-center rounded-xl border border-input bg-muted px-3.5 text-sm text-muted-foreground/50">
                    Ask your agent a question…
                  </div>
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground/30">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      className="h-4 w-4"
                      aria-hidden="true"
                    >
                      <path
                        d="M5 12h13M13 6l6 6-6 6"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
