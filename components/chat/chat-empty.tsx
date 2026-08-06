"use client";

import { motion } from "framer-motion";
import { AgentAvatar } from "@/components/customize/agent-icons";

/**
 * C-Support — Chat Empty State
 *
 * Centered welcome screen shown when no messages exist.
 * Large avatar with lime glow shadow, welcome text, subtitle.
 * Entry animation: framer-motion opacity + slide, spring bounce:0.
 */

interface ChatEmptyProps {
  avatarId: string;
}

export function ChatEmpty({ avatarId }: ChatEmptyProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", bounce: 0, duration: 0.4 }}
      className="flex flex-1 flex-col items-center justify-center px-6"
    >
      {/* Avatar with lime glow */}
      <div
        className="mb-5"
        style={{ boxShadow: "0 8px 32px rgba(184, 222, 114, 0.15)" }}
      >
        <AgentAvatar
          avatarId={avatarId}
          size="xl"
          className="h-14 w-14 rounded-[18px] sm:h-16 sm:w-16"
        />
      </div>

      {/* Welcome text */}
      <h2 className="mb-2 text-center text-base font-medium tracking-[-0.01em] text-white">
        How can I help your customers today?
      </h2>

      {/* Subtitle */}
      <p className="text-center text-xs text-[rgba(169,195,188,0.4)]">
        Type a message below to start a conversation
      </p>
    </motion.div>
  );
}
