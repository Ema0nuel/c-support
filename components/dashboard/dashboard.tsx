"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { AgentAvatar } from "@/components/customize/agent-icons";
import { personalityById } from "@/lib/agent";
import { useAgentStore } from "@/store/agent";
import { useOnboardingStore } from "@/store/onboarding";
import { cn } from "@/lib/utils";

/**
 * C-Support — Dashboard
 *
 * The landing page after agent creation. A hero card with the agent's
 * face, a Launch Agent button that opens the test chat in a new tab,
 * and a summary of how the agent was configured. No sidebar here —
 * the main region is laid out so one can be added later.
 */
export function Dashboard() {
  const agentName = useAgentStore((s) => s.agentName);
  const personalityId = useAgentStore((s) => s.personalityId);
  const greeting = useAgentStore((s) => s.greeting);
  const avatarId = useAgentStore((s) => s.avatarId);
  const enabledCategories = useAgentStore((s) => s.enabledCategories);
  const handoffMessage = useAgentStore((s) => s.handoffMessage);

  const businessName = useOnboardingStore((s) => s.businessName);
  const businessNiche = useOnboardingStore((s) => s.businessNiche);
  const aiAnalysis = useOnboardingStore((s) => s.aiAnalysis);

  const hydrated = useAgentStore((s) => s._hasHydrated);

  const personality = personalityById(personalityId);

  const excerpt = (text: string, max = 64) =>
    text.length > max ? `${text.slice(0, max)}…` : text;

  if (!hydrated) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <div className="flex items-center gap-3 text-muted-foreground">
          <span className="cs-loader h-5 w-5 rounded-full border-2 border-border border-t-primary" />
          <span className="text-sm">Loading your agent…</span>
        </div>
      </div>
    );
  }

  return (
    <main className="flex min-h-dvh flex-col bg-background">
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-6 py-8 sm:px-8">
        {/* Header */}
        <header className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AgentAvatar avatarId={avatarId} size="md" />
            <div>
              <p className="text-sm font-semibold text-foreground">
                {agentName.trim() || "Your agent"}
              </p>
              <p className="text-xs text-muted-foreground">
                {businessName.trim() || "Your business"}
              </p>
            </div>
          </div>
          <Link
            href="/customize/name"
            className="text-sm font-medium text-primary transition-colors hover:text-primary/80"
          >
            Back to customization
          </Link>
        </header>

        {/* Hero — Launch Agent */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
          className="relative mb-8 overflow-hidden rounded-3xl bg-teal-950 p-8 text-white shadow-lg shadow-black/10 sm:p-10"
        >
          {/* Soft lime glow */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-lime-400/10 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-20 -left-10 h-48 w-48 rounded-full bg-lime-400/5 blur-2xl"
          />

          <div className="relative">
            <div className="mb-5 flex items-center gap-4">
              <AgentAvatar
                avatarId={avatarId}
                size="xl"
                className="border border-white/20"
              />
              <div>
                <p className="text-xl font-bold sm:text-2xl">
                  Your support agent is ready
                </p>
                <p className="mt-0.5 text-sm text-white/70">
                  {businessName.trim() || "Your business"} ·{" "}
                  {businessNiche.trim() || "Customer support"}
                </p>
              </div>
            </div>

            <p className="mb-6 max-w-md text-sm leading-relaxed text-white/70">
              {excerpt(greeting.trim() || "Your agent is ready to talk.")}
            </p>

            <button
              type="button"
              onClick={() => window.open("/chat", "_blank")}
              className={cn(
                "inline-flex items-center gap-2 rounded-xl bg-lime-400 px-6 py-3 text-sm font-semibold text-teal-950",
                "transition-[background-color,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]",
                "hover:bg-lime-300 active:scale-[0.97]"
              )}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-4 w-4"
                aria-hidden="true"
              >
                <path
                  d="M12 3v13M7 11l5 5 5-5M5 20h14"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Launch agent
            </button>
          </div>
        </motion.section>

        {/* Summary */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2"
        >
          {/* Personality */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Personality
            </p>
            <p className="text-sm font-semibold text-foreground">
              {personality?.label ?? "Professional"}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              {excerpt(personality?.description ?? "", 110)}
            </p>
          </div>

          {/* Knowledge */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
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
            <p className="mt-2 text-sm text-muted-foreground">
              {excerpt(aiAnalysis?.summary?.trim() || "", 110)}
            </p>
          </div>

          {/* Handoff */}
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Handoff
            </p>
            <p className="text-sm leading-relaxed text-foreground">
              {excerpt(handoffMessage.trim() || "—", 110)}
            </p>
          </div>

          {/* Tip */}
          <div className="rounded-2xl border border-border bg-primary/5 p-5 shadow-sm">
            <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Next step
            </p>
            <p className="text-sm leading-relaxed text-foreground">
              Hit <span className="font-semibold">Launch agent</span> to open
              the test chat in a new tab and try it yourself.
            </p>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
