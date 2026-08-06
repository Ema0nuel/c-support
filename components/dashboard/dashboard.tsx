"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useAgentStore } from "@/store/agent";
import { getConversationStats } from "@/lib/conversations";
import { DashboardLayout } from "./dashboard-layout";
import { DashboardStats } from "./dashboard-stats";
import { DashboardAgent } from "./dashboard-agent";
import { DashboardActivity } from "./dashboard-activity";
import { type DashboardTab } from "./dashboard-sidebar";
import { ConversationsView } from "@/components/conversations/conversations-view";

/**
 * C-Support — Dashboard
 *
 * Full dashboard with glass sidebar (desktop) / bottom island navbar (mobile).
 * Two tabs: Dashboard, Conversations. Settings routes to /settings.
 */
export function Dashboard() {
  const [activeTab, setActiveTab] = useState<DashboardTab>("dashboard");

  // ── Zustand: agent ─────────────────────────────────
  const hydrated = useAgentStore((s) => s._hasHydrated);

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

