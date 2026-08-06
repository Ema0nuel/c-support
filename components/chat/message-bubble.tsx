"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { AgentAvatar } from "@/components/customize/agent-icons";
import { CopyIcon } from "./chat-icons";
import { cn } from "@/lib/utils";

/**
 * C-Support — Message Bubble
 *
 * Individual message bubble for agent or user role.
 * - Agent: left-aligned, prefixed with AgentAvatar glyph, glass teal bg
 * - User: right-aligned, lime bg, no avatar
 * - Hover actions (copy + regenerate) only on the latest agent message
 * - Entry: framer-motion spring entrance, bounce:0
 */

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp?: number;
}

interface MessageBubbleProps {
  message: ChatMessage;
  avatarId: string;
  isLatest?: boolean;
}

export function MessageBubble({ message, avatarId, isLatest }: MessageBubbleProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [copied, setCopied] = useState(false);
  const isAgent = message.role === "assistant";

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API not available — silent fail
    }
  }, [message.content]);

  if (isAgent) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", bounce: 0, duration: 0.4 }}
        className="flex items-start gap-2 sm:gap-2.5"
      >
        {/* Agent avatar */}
        <AgentAvatar
          avatarId={avatarId}
          size="sm"
          className="mt-0.5 h-5 w-5 shrink-0 rounded-md sm:h-6 sm:w-6 sm:rounded-lg"
        />

        {/* Bubble + actions wrapper */}
        <div
          className="group relative max-w-[85%] sm:max-w-[75%]"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Bubble */}
          <div
            className={cn(
              "rounded-xl border px-3.5 py-2.5 sm:px-4",
              "bg-[rgba(11,80,70,0.5)] border-[rgba(23,96,85,0.4)]",
              "rounded-tl-sm"
            )}
          >
            <p className="whitespace-pre-wrap text-[13px] leading-[1.5] text-[rgba(255,255,255,0.85)]">
              {message.content}
            </p>
          </div>

          {/* Hover actions — copy only, on latest assistant message */}
          {isLatest && (
            <div
              className={cn(
                "mt-1 flex items-center gap-1.5",
                "transition-opacity duration-150",
                isHovered ? "opacity-100" : "opacity-0"
              )}
            >
              <button
                type="button"
                onClick={handleCopy}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-2 py-1",
                  "bg-[rgba(2,75,65,0.5)] text-[rgba(169,195,188,0.5)]",
                  "transition-colors duration-150 hover:text-white"
                )}
                aria-label={copied ? "Copied" : "Copy message"}
              >
                <CopyIcon className="h-3.5 w-3.5" />
                {copied && (
                  <span className="text-[10px] font-medium text-[#B8DE72]">
                    Copied!
                  </span>
                )}
              </button>
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  // ── User bubble ──────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", bounce: 0, duration: 0.4 }}
      className="flex justify-end"
    >
      <div
        className={cn(
          "max-w-[85%] rounded-xl px-3.5 py-2.5 sm:max-w-[75%] sm:px-4",
          "bg-primary text-primary-foreground font-medium",
          "rounded-tr-sm"
        )}
      >
        <p className="whitespace-pre-wrap text-[13px] leading-[1.5]">
          {message.content}
        </p>
      </div>
    </motion.div>
  );
}
