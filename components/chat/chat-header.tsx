"use client";

import { AgentAvatar } from "@/components/customize/agent-icons";
import { CloseIcon, BackIcon } from "./chat-icons";
import { cn } from "@/lib/utils";

/**
 * C-Support — Chat Header
 *
 * Glass top bar with agent info, status dot, and close/back control.
 * - Desktop: background blur(24px) saturate(180%), agent name + status + Close
 * - Mobile: slimmer padding, smaller avatar, Back chevron instead of Close
 */

interface ChatHeaderProps {
  agentName: string;
  avatarId: string;
}

export function ChatHeader({ agentName, avatarId }: ChatHeaderProps) {
  return (
    <header
      className={cn(
        "flex shrink-0 items-center justify-between",
        "bg-[rgba(11,80,70,0.5)] backdrop-blur-xl backdrop-saturate-[1.8]",
        "border-b border-[rgba(23,96,85,0.4)]",
        "px-4 py-3 sm:px-5"
      )}
    >
      {/* Left: Avatar + name + status */}
      <div className="flex items-center gap-2.5">
        {/* Mobile back chevron */}
        <button
          type="button"
          onClick={() => window.history.back()}
          className={cn(
            "mr-1 flex h-7 w-7 items-center justify-center rounded-md",
            "text-[rgba(169,195,188,0.5)] transition-colors duration-150",
            "hover:text-white sm:hidden",
            "hover:bg-[rgba(169,195,188,0.08)]"
          )}
          aria-label="Go back"
        >
          <BackIcon className="h-4 w-4" />
        </button>

        {/* Avatar tile */}
        <div className="relative shrink-0">
          <AgentAvatar
            avatarId={avatarId}
            size="sm"
            className="h-6 w-6 rounded-lg sm:h-7 sm:w-7 sm:rounded-xl"
          />
          {/* Online dot */}
          <span className="absolute -bottom-0.5 -right-0.5 h-[5px] w-[5px] rounded-full bg-primary ring-2 ring-[rgba(2,75,65,0.8)]" />
        </div>

        {/* Name */}
        <span className="truncate text-[13px] font-medium text-white">
          {agentName || "Agent"}
        </span>
      </div>

      {/* Right: close */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => window.close()}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg",
            "text-[rgba(169,195,188,0.3)] transition-colors duration-150",
            "hover:text-white hover:bg-[rgba(169,195,188,0.08)]"
          )}
          aria-label="Close chat"
        >
          <CloseIcon className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
