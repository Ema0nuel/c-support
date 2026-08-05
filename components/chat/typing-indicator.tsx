"use client";

import { AgentAvatar } from "@/components/customize/agent-icons";

/**
 * C-Support — Typing Indicator
 *
 * Three dots that bob in sequence while the agent "thinks". The animation
 * is pure CSS (`.typing-dot` in globals.css) so it runs off the main
 * thread instead of competing with the chat render.
 */
export function TypingIndicator({ avatarId }: { avatarId: string }) {
  return (
    <div className="flex items-start gap-3">
      <AgentAvatar avatarId={avatarId} size="sm" />
      <div
        className="flex items-center gap-1.5 rounded-2xl rounded-tl-sm bg-muted px-4 py-3.5"
        aria-label="Agent is typing"
      >
        <span className="typing-dot" />
        <span className="typing-dot" style={{ animationDelay: "0.15s" }} />
        <span className="typing-dot" style={{ animationDelay: "0.3s" }} />
      </div>
    </div>
  );
}
