"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useAgentStore } from "@/store/agent";
import { useOnboardingStore } from "@/store/onboarding";
import { listConversations, getConversationStats } from "@/lib/conversations";
import { personalityById, type Personality } from "@/lib/agent";
import { cn } from "@/lib/utils";
import { DashboardLayout } from "./dashboard-layout";
import { DashboardStats } from "./dashboard-stats";
import { DashboardAgent } from "./dashboard-agent";
import { DashboardActivity } from "./dashboard-activity";
import { type DashboardTab } from "./dashboard-sidebar";
import { AgentAvatar } from "@/components/customize/agent-icons";
import Link from "next/link";

/**
 * C-Support — Dashboard
 *
 * Full dashboard with glass sidebar (desktop) / bottom island navbar (mobile).
 * Three tabs: Dashboard, Conversations, Settings.
 */
export function Dashboard() {
  const [activeTab, setActiveTab] = useState<DashboardTab>("dashboard");

  // ── Zustand: agent ─────────────────────────────────
  const agentName = useAgentStore((s) => s.agentName);
  const personalityId = useAgentStore((s) => s.personalityId);
  const avatarId = useAgentStore((s) => s.avatarId);
  const enabledCategories = useAgentStore((s) => s.enabledCategories);
  const hydrated = useAgentStore((s) => s._hasHydrated);

  // ── Zustand: onboarding ────────────────────────────
  const businessNiche = useOnboardingStore((s) => s.businessNiche);

  // ── Derived ────────────────────────────────────────
  const personality = personalityById(personalityId);
  const displayName = agentName.trim() || "Your agent";

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
    <DashboardLayout activeTab={activeTab} onTabChange={setActiveTab}>
      {activeTab === "dashboard" && <DashboardView />}
      {activeTab === "conversations" && <ConversationsView />}
      {activeTab === "settings" && (
        <SettingsView
          agentName={displayName}
          personality={personality ?? null}
          businessNiche={businessNiche}
          avatarId={avatarId}
          enabledCategories={enabledCategories}
        />
      )}
    </DashboardLayout>
  );
}

// ═══════════════════════════════════════════════════
// Dashboard Tab — Stats + Agent Config + Activity
// ═══════════════════════════════════════════════════

function DashboardView() {
  const stats = getConversationStats();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
      className="space-y-6"
    >
      <DashboardStats
          conversations={stats.totalConversations}
          messages={stats.totalMessages}
          avgResponseTime={stats.avgResponseTime}
          satisfaction={94}
        />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <DashboardAgent />
        <DashboardActivity />
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════
// Conversations Tab — Recent list from localStorage
// ═══════════════════════════════════════════════════

function ConversationsView() {
  const conversations = listConversations();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", bounce: 0, duration: 0.4 }}
    >
      {conversations.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center rounded-2xl border py-16 text-center"
          style={{
            background: "rgba(11,80,70,0.3)",
            borderColor: "rgba(23,96,85,0.4)",
          }}
        >
          <div className="mb-3 text-[#A9C3BC]/40">
            <svg
              viewBox="0 0 20 20"
              fill="none"
              className="mx-auto h-8 w-8"
              aria-hidden="true"
            >
              <path
                d="M3 4.5C3 3.67 3.67 3 4.5 3h11c.83 0 1.5.67 1.5 1.5v8c0 .83-.67 1.5-1.5 1.5H7l-3 3v-3H4.5c-.83 0-1.5-.67-1.5-1.5v-8z"
                stroke="currentColor"
                strokeWidth="1.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <p className="text-sm font-medium text-white/70">No conversations yet</p>
          <p className="mt-1 text-xs text-[#A9C3BC]/40">
            Launch your agent to start a conversation
          </p>
        </div>
      ) : (
        <div
          className="overflow-hidden rounded-2xl border"
          style={{
            background: "rgba(11,80,70,0.3)",
            borderColor: "rgba(23,96,85,0.4)",
          }}
        >
          {conversations.map((convo, idx) => (
            <div
              key={convo.id}
              className={cn(
                "px-4 py-3",
                idx < conversations.length - 1 && "border-b"
              )}
              style={{ borderColor: "rgba(23,96,85,0.3)" }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white/85">
                    {convo.title}
                  </p>
                  <p className="mt-0.5 text-xs text-[#A9C3BC]/40">
                    {convo.messages.length} message{convo.messages.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <span className="shrink-0 text-[10px] text-[#A9C3BC]/40">
                  {formatRelativeTime(convo.updatedAt)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════
// Settings Tab — Agent name, personality, edit link
// ═══════════════════════════════════════════════════

function SettingsView({
  agentName,
  personality,
  businessNiche,
  avatarId,
  enabledCategories,
}: {
  agentName: string;
  personality: Personality | null;
  businessNiche: string;
  avatarId: string;
  enabledCategories: string[];
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", bounce: 0, duration: 0.4 }}
      className="space-y-6"
    >
      {/* Agent Card */}
      <div
        className="rounded-2xl border p-6"
        style={{
          background: "rgba(11,80,70,0.4)",
          borderColor: "rgba(23,96,85,0.4)",
        }}
      >
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-[0.06em] text-[#A9C3BC]/50">
            Agent Identity
          </p>
          <Link
            href="/customize/name"
            className="text-xs font-medium text-[#B8DE72]/70 transition-colors hover:text-[#B8DE72]"
          >
            Edit
          </Link>
        </div>
        <div className="mt-4 flex items-center gap-4">
          <AgentAvatar avatarId={avatarId} size="lg" />
          <div>
            <p className="text-base font-semibold text-white">{agentName}</p>
            <p className="mt-0.5 text-xs text-[#A9C3BC]/50">
              {personality?.label ?? "Professional"} · {businessNiche || "Customer support"}
            </p>
          </div>
        </div>
      </div>

      {/* Personality */}
      <SettingRow label="Personality" value={personality?.label ?? "Professional"} />
      <SettingRow label="Industry" value={businessNiche || "Customer support"} />

      {/* Knowledge Categories */}
      <div
        className="rounded-xl px-3 py-2.5"
        style={{ background: "rgba(2,75,65,0.5)" }}
      >
        <div className="flex items-center justify-between">
          <span className="text-xs text-[#A9C3BC]/50">Knowledge</span>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {enabledCategories.length > 0 ? (
            enabledCategories.map((cat) => (
              <span
                key={cat}
                className="inline-block rounded-md px-2 py-0.5 text-[10px]"
                style={{
                  background: "rgba(184,222,114,0.1)",
                  color: "rgba(184,222,114,0.7)",
                }}
              >
                {cat}
              </span>
            ))
          ) : (
            <span className="text-xs text-[#A9C3BC]/30">No categories selected</span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function SettingRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="flex items-center justify-between rounded-xl px-3 py-2.5"
      style={{ background: "rgba(2,75,65,0.5)" }}
    >
      <span className="text-xs text-[#A9C3BC]/50">{label}</span>
      <span className="text-xs font-medium text-white/80">{value}</span>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════

function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
