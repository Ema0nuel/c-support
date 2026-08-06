"use client";

import { AgentAvatar } from "@/components/customize/agent-icons";
import type { LocalMessage } from "@/lib/conversations";

/**
 * ConversationMessage — Read-only message bubble for the conversation detail view.
 *
 * Same visual style as MessageBubble but without hover actions (copy, regenerate).
 * Agent messages: left-aligned with avatar, glass teal bg.
 * User messages: right-aligned, lime bg.
 * Each message shows a timestamp below, and assistant messages show response time.
 */

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatResponseTime(ms: number): string {
  const seconds = (ms / 1000).toFixed(1);
  return `${seconds}s`;
}

interface ConversationMessageProps {
  message: LocalMessage;
  avatarId: string;
}

export function ConversationMessage({ message, avatarId }: ConversationMessageProps) {
  const isAgent = message.role === "assistant";

  if (isAgent) {
    return (
      <div className="flex items-start gap-2 sm:gap-2.5">
        <AgentAvatar
          avatarId={avatarId}
          size="sm"
          className="mt-0.5 h-5 w-5 shrink-0 rounded-md sm:h-6 sm:w-6 sm:rounded-lg"
        />
        <div className="max-w-[85%] sm:max-w-[75%]">
          <div
            className="rounded-xl rounded-tl-sm border px-3.5 py-2.5 sm:px-4"
            style={{
              background: "rgba(11,80,70,0.5)",
              borderColor: "rgba(23,96,85,0.4)",
            }}
          >
            <p className="whitespace-pre-wrap text-[13px] leading-[1.5] text-white/85">
              {message.content}
            </p>
          </div>
          <p className="mt-1 text-[10px] text-[#A9C3BC]/30">
            {formatTime(message.timestamp)}
            {message.responseTime && (
              <span className="ml-1.5">({formatResponseTime(message.responseTime)})</span>
            )}
          </p>
        </div>
      </div>
    );
  }

  // ── User bubble ──
  return (
    <div className="flex justify-end">
      <div className="max-w-[85%] sm:max-w-[75%]">
        <div
          className="rounded-xl rounded-tr-sm bg-primary px-3.5 py-2.5 font-medium text-primary-foreground sm:px-4"
        >
          <p className="whitespace-pre-wrap text-[13px] leading-[1.5]">
            {message.content}
          </p>
        </div>
        <p className="mt-1 text-right text-[10px] text-[#A9C3BC]/30">
          {formatTime(message.timestamp)}
        </p>
      </div>
    </div>
  );
}
