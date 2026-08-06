"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAgentStore } from "@/store/agent";
import { listConversations, type LocalConversation } from "@/lib/conversations";
import { ConversationCard } from "./conversation-card";
import { ConversationDetail } from "./conversation-detail";

/**
 * ConversationsView — State owner for the Conversations tab.
 *
 * Manages the list↔detail transition:
 * - List mode: shows ConversationCard for each conversation
 * - Detail mode: shows ConversationDetail for the selected conversation
 * - AnimatePresence handles the slide transition between modes
 */

export function ConversationsView() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<LocalConversation[]>(() => listConversations());
  const avatarId = useAgentStore((s) => s.avatarId);

  const selectedConversation = selectedId
    ? conversations.find((c) => c.id === selectedId) ?? null
    : null;

  const handleSelect = useCallback((id: string) => {
    setSelectedId(id);
  }, []);

  const handleBack = useCallback(() => {
    setSelectedId(null);
  }, []);

  const handleDelete = useCallback((id: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== id));
    setSelectedId(null);
  }, []);

  return (
    <AnimatePresence mode="wait">
      {selectedConversation ? (
        <ConversationDetail
          key="detail"
          conversation={selectedConversation}
          avatarId={avatarId}
          onBack={handleBack}
          onDelete={handleDelete}
        />
      ) : (
        <motion.div
          key="list"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ type: "spring", bounce: 0, duration: 0.35 }}
        >
          {conversations.length === 0 ? (
            <EmptyState />
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
                  className={
                    idx < conversations.length - 1
                      ? "border-b border-[rgba(23,96,85,0.3)]"
                      : undefined
                  }
                >
                  <ConversationCard
                    conversation={convo}
                    onClick={() => handleSelect(convo.id)}
                  />
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ═══════════════════════════════════════════════════
// Empty State
// ═══════════════════════════════════════════════════

function EmptyState() {
  return (
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
  );
}
