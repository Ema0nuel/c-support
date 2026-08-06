"use client";

import { motion } from "framer-motion";
import { AgentAvatar } from "@/components/customize/agent-icons";

/**
 * C-Support — Typing Indicator
 *
 * Three bouncing dots wrapped in agent bubble style (avatar + dot container).
 * Uses the CSS `typing-bounce` keyframe from globals.css with staggered delays.
 * Entry animation: framer-motion opacity + slide, spring bounce:0.
 */

export function TypingIndicator({ avatarId }: { avatarId: string }) {
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

      {/* Dot container — matches agent bubble style */}
      <div
        className="flex items-center gap-1.25 rounded-xl rounded-tl-sm border border-[rgba(23,96,85,0.4)] bg-[rgba(11,80,70,0.5)] px-4 py-3"
        aria-label="Agent is typing"
        role="status"
      >
        <span
          className="typing-dot"
          style={{
            width: 5,
            height: 5,
            background: "rgba(169,195,188,0.3)",
            borderRadius: "50%",
            animationDelay: "0s",
          }}
        />
        <span
          className="typing-dot"
          style={{
            width: 5,
            height: 5,
            background: "rgba(169,195,188,0.3)",
            borderRadius: "50%",
            animationDelay: "0.2s",
          }}
        />
        <span
          className="typing-dot"
          style={{
            width: 5,
            height: 5,
            background: "rgba(169,195,188,0.3)",
            borderRadius: "50%",
            animationDelay: "0.4s",
          }}
        />
      </div>
    </motion.div>
  );
}
