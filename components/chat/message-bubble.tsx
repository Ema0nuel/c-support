"use client";

import { AgentAvatar } from "@/components/customize/agent-icons";
import { cn } from "@/lib/utils";

/**
 * C-Support — Chat Message Bubble
 *
 * Customer messages sit right in the primary color; agent messages sit
 * left next to the agent's avatar. The tail corner is rounded on the
 * speaker's side to anchor the bubble to its author.
 */

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export function MessageBubble({
  message,
  avatarId,
}: {
  message: ChatMessage;
  avatarId: string;
}) {
  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "flex items-start gap-3",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {!isUser && <AgentAvatar avatarId={avatarId} size="sm" />}
      <div
        className={cn(
          "max-w-[78%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
          isUser
            ? "rounded-br-sm bg-primary text-primary-foreground"
            : "rounded-tl-sm bg-muted text-foreground"
        )}
      >
        {message.content}
      </div>
    </div>
  );
}
