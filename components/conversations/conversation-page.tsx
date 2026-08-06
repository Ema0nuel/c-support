"use client";

import { useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useConversationsStore } from "@/store/conversations";
import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { ConversationCard } from "./conversation-card";

/**
 * ConversationPage — Standalone /conversation view.
 *
 * Renders the shared sidebar shell + the conversations list,
 * powered by the Zustand conversations store.
 */

// ─── Animation Variants ────────────────────────────

const listVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const cardVariant = {
  hidden: { opacity: 0, y: 8 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, bounce: 0, duration: 0.4 },
  },
};

// ═══════════════════════════════════════════════════
// ConversationPage
// ═══════════════════════════════════════════════════

export function ConversationPage() {
  const hydrated = useConversationsStore((s) => s._hasHydrated);
  const conversations = useConversationsStore((s) => s.conversations);
  const loadConversations = useConversationsStore((s) => s.loadConversations);

  // Sync from raw localStorage after hydration — the chat interface writes
  // to "c-support-conversations" directly via lib/conversations.ts, so we
  // need to re-read to pick up any new conversations since last persist.
  useEffect(() => {
    if (hydrated) {
      loadConversations();
    }
  }, [hydrated, loadConversations]);

  // Hydration gating — wait for Zustand to rehydrate from localStorage
  if (!hydrated) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <div className="flex items-center gap-3 text-muted-foreground">
          <span className="cs-loader h-5 w-5 rounded-full border-2 border-border border-t-primary" />
          <span className="text-sm">Loading conversations…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar (desktop) + Bottom Island (mobile) */}
      <DashboardSidebar />

      {/* Content Area */}
      <main className="flex-1 min-w-0 overflow-y-auto">
        <div className="px-6 py-6 md:px-8 md:py-7 pb-24 md:pb-7">
          {/* Header Row */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", bounce: 0, duration: 0.4 }}
            className="flex items-start justify-between gap-4 mb-6"
          >
            <div className="flex flex-col">
              <h1
                className="text-white font-semibold"
                style={{
                  fontSize: "22px",
                  letterSpacing: "-0.025em",
                  lineHeight: 1.2,
                }}
              >
                Conversations
              </h1>
              <span className="text-[13px] text-[#A9C3BC]/60 mt-0.5">
                View recent conversations
              </span>
            </div>
          </motion.div>

          {/* Content */}
          {conversations.length === 0 ? (
            <EmptyState />
          ) : (
            <motion.div
              variants={listVariants}
              initial="hidden"
              animate="show"
              className="overflow-hidden rounded-2xl border"
              style={{
                background: "rgba(11,80,70,0.3)",
                borderColor: "rgba(23,96,85,0.4)",
              }}
            >
              <AnimatePresence>
                {conversations.map((convo, idx) => (
                  <motion.div
                    key={convo.id}
                    variants={cardVariant}
                    layout
                    className={
                      idx < conversations.length - 1
                        ? "border-b border-[rgba(23,96,85,0.3)]"
                        : undefined
                    }
                  >
                    <ConversationCard conversation={convo} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </main>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// Empty State
// ═══════════════════════════════════════════════════

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", bounce: 0, duration: 0.4 }}
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
      <Link
        href="/chat"
        className="btn-press mt-4 inline-flex items-center gap-2 rounded-[10px] px-4 py-2 text-[13px] font-semibold transition-opacity duration-200 hover:opacity-90"
        style={{ background: "#B8DE72", color: "#024B41" }}
      >
        Launch Agent
      </Link>
    </motion.div>
  );
}
