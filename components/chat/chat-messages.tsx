"use client";

import { useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { MessageBubble, type ChatMessage } from "./message-bubble";
import { ChatEmpty } from "./chat-empty";
import { TypingIndicator } from "./typing-indicator";

/**
 * C-Support — Chat Messages
 *
 * Scrollable message list with auto-scroll to bottom on new messages.
 * Shows ChatEmpty when no messages exist and hydration is complete.
 * Typing indicator is appended at the end when isLoading is true.
 */

interface ChatMessagesProps {
  messages: ChatMessage[];
  isHydrated: boolean;
  isLoading: boolean;
  avatarId: string;
}

export function ChatMessages({
  messages,
  isHydrated,
  isLoading,
  avatarId,
}: ChatMessagesProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages or loading state change
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    // Use requestAnimationFrame to ensure DOM has painted
    requestAnimationFrame(() => {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    });
  }, [messages, isLoading]);

  // Empty state — show when hydrated and no messages
  if (isHydrated && messages.length === 0 && !isLoading) {
    return <ChatEmpty avatarId={avatarId} />;
  }

  // Find the index of the last assistant message for hover actions
  const lastAssistantIdx = (() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === "assistant") return i;
    }
    return -1;
  })();

  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto px-3 py-5 sm:px-4 md:px-6"
      style={{ scrollBehavior: "smooth" }}
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="mx-auto flex max-w-2xl flex-col gap-3 sm:gap-4"
      >
        {messages.map((msg, idx) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            avatarId={avatarId}
            isLatest={idx === lastAssistantIdx && msg.role === "assistant"}
          />
        ))}

        {isLoading && <TypingIndicator avatarId={avatarId} />}
      </motion.div>
    </div>
  );
}
