"use client";

import { useCallback, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { ConversationMessage } from "./conversation-message";
import { deleteConversation, getConversationIntents, type LocalConversation } from "@/lib/conversations";
import { cn } from "@/lib/utils";

/**
 * ConversationDetail — Full detail view for a single conversation.
 *
 * Layout:
 * 1. Back header (glass bar) — back arrow + title
 * 2. Metadata bar — message count, created time, avg response time, intent tags
 * 3. Message thread (scrollable) — ConversationMessage for each message
 * 4. Danger zone — delete button
 */

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

const INTENT_LABELS: Record<string, string> = {
  refund: "refund",
  returns: "returns",
  shipping: "shipping",
  delivery: "delivery",
  order_status: "order",
  order_cancel: "cancel",
  complaint: "complaint",
  payment: "payment",
  billing: "billing",
  subscription: "subscription",
  account_signup: "signup",
  account_login: "login",
  account_password: "password",
  product: "product",
  contact: "contact",
  escalation: "escalation",
  help: "help",
  greeting: "greeting",
  cancellation: "cancel",
  exchange: "exchange",
};

interface ConversationDetailProps {
  conversation: LocalConversation;
  avatarId: string;
  onBack: () => void;
  onDelete: (id: string) => void;
}

export function ConversationDetail({
  conversation,
  avatarId,
  onBack,
  onDelete,
}: ConversationDetailProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on mount
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      el.scrollTo({ top: el.scrollHeight, behavior: "instant" });
    });
  }, []);

  // Compute avg response time
  const avgResponseTime = (() => {
    const responseTimes = conversation.messages
      .filter((m) => m.responseTime)
      .map((m) => m.responseTime!);
    if (responseTimes.length === 0) return null;
    const avg = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    return (avg / 1000).toFixed(1);
  })();

  const intents = getConversationIntents(conversation);

  const handleDelete = useCallback(() => {
    const confirmed = window.confirm(
      "Delete this conversation? This can't be undone."
    );
    if (confirmed) {
      deleteConversation(conversation.id);
      onDelete(conversation.id);
    }
  }, [conversation.id, onDelete]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ type: "spring", bounce: 0, duration: 0.35 }}
      className="flex flex-col"
    >
      {/* ── Back Header ── */}
      <div
        className={cn(
          "flex shrink-0 items-center gap-3",
          "rounded-xl border px-4 py-3",
        )}
        style={{
          background: "rgba(11,80,70,0.5)",
          borderColor: "rgba(23,96,85,0.4)",
        }}
      >
        <button
          onClick={onBack}
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
            "text-[#A9C3BC]/50 transition-colors duration-150",
            "hover:text-white hover:bg-white/5"
          )}
          aria-label="Back to conversations"
        >
          <svg
            viewBox="0 0 16 16"
            fill="none"
            className="h-4 w-4"
            aria-hidden="true"
          >
            <path
              d="M10 12L6 8l4-4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <p className="truncate text-sm font-medium text-white/85">
          {conversation.title}
        </p>
      </div>

      {/* ── Metadata Bar ── */}
      <div
        className="mt-3 rounded-xl px-3 py-2.5"
        style={{ background: "rgba(2,75,65,0.5)" }}
      >
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[#A9C3BC]/50">
          <span>{conversation.messages.length} message{conversation.messages.length !== 1 ? "s" : ""}</span>
          <span className="text-[#A9C3BC]/20">·</span>
          <span>Created {formatRelativeTime(conversation.createdAt)}</span>
          {avgResponseTime && (
            <>
              <span className="text-[#A9C3BC]/20">·</span>
              <span>Avg reply {avgResponseTime}s</span>
            </>
          )}
        </div>
        {intents.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {intents.map((intent) => (
              <span
                key={intent}
                className="rounded-md px-1.5 py-0.5 text-[10px]"
                style={{
                  background: "rgba(184,222,114,0.1)",
                  color: "rgba(184,222,114,0.7)",
                }}
              >
                {INTENT_LABELS[intent] ?? intent}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ── Message Thread ── */}
      <div
        ref={scrollRef}
        className="mt-4 flex-1 space-y-3 overflow-y-auto"
      >
        {conversation.messages.map((msg) => (
          <ConversationMessage
            key={msg.id}
            message={msg}
            avatarId={avatarId}
          />
        ))}
      </div>

      {/* ── Danger Zone ── */}
      <div className="mt-6">
        <button
          onClick={handleDelete}
          className={cn(
            "w-full rounded-xl border px-4 py-2.5 text-xs font-medium",
            "transition-colors duration-150",
            "border-[rgba(248,113,113,0.2)] bg-[rgba(248,113,113,0.08)] text-[#F87171]",
            "hover:bg-[rgba(248,113,113,0.15)]"
          )}
        >
          Delete Conversation
        </button>
      </div>
    </motion.div>
  );
}
