"use client";

import type { LocalConversation } from "@/lib/conversations";
import { getConversationIntents } from "@/lib/conversations";
import { cn } from "@/lib/utils";

/**
 * ConversationCard — Rich card for the conversations list.
 *
 * Shows: title, first user message preview, message count,
 * intent category tags (up to 3), and relative timestamp.
 *
 * Emil Kowalski: "Tactile press on click, hover lift on fine pointer."
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

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max)}…` : text;
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

interface ConversationCardProps {
  conversation: LocalConversation;
  onClick: () => void;
}

export function ConversationCard({ conversation, onClick }: ConversationCardProps) {
  const preview = (() => {
    const firstUserMsg = conversation.messages.find((m) => m.role === "user");
    return firstUserMsg ? truncate(firstUserMsg.content, 80) : "Greeting only";
  })();

  const intents = getConversationIntents(conversation);
  const messageCount = conversation.messages.length;

  return (
    <button
      onClick={onClick}
      className={cn(
        "btn-press w-full px-4 py-3 text-left",
        "transition-colors duration-150",
        "hover:bg-white/5"
      )}
    >
      {/* Row 1: Title */}
      <p className="truncate text-sm font-medium text-white/85">
        {conversation.title}
      </p>

      {/* Row 2: Preview */}
      <p className="mt-0.5 truncate text-xs text-[#A9C3BC]/40">
        {preview}
      </p>

      {/* Row 3: Metadata */}
      <div className="mt-2 flex items-center gap-2">
        {/* Message count */}
        <span className="text-[10px] text-[#A9C3BC]/40">
          {messageCount} msg{messageCount !== 1 ? "s" : ""}
        </span>

        {/* Intent tags */}
        {intents.length > 0 && (
          <>
            <span className="text-[10px] text-[#A9C3BC]/20">·</span>
            <div className="flex flex-wrap gap-1">
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
          </>
        )}

        {/* Timestamp — pushed to the right */}
        <span className="ml-auto shrink-0 text-[10px] text-[#A9C3BC]/40">
          {formatRelativeTime(conversation.updatedAt)}
        </span>
      </div>
    </button>
  );
}
