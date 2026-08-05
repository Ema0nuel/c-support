"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { AgentAvatar } from "@/components/customize/agent-icons";
import { MessageBubble, type ChatMessage } from "./message-bubble";
import { TypingIndicator } from "./typing-indicator";
import { getDefaultGreeting } from "@/lib/agent";
import { useAgentStore } from "@/store/agent";
import { useOnboardingStore } from "@/store/onboarding";
import { cn } from "@/lib/utils";

/**
 * C-Support — Test Chat Interface
 *
 * The full-page chat the Launch Agent button opens in a new tab. The
 * greeting is auto-appended as the first assistant message, then every
 * exchange is POSTed to /api/chat with the agent's full context
 * (business + agent + personality + scope + handoff) so each reply is
 * grounded in how the agent was configured.
 */
export function ChatInterface() {
  const agentName = useAgentStore((s) => s.agentName);
  const avatarId = useAgentStore((s) => s.avatarId);
  const greeting = useAgentStore((s) => s.greeting);
  const personalityId = useAgentStore((s) => s.personalityId);
  const enabledCategories = useAgentStore((s) => s.enabledCategories);
  const handoffMessage = useAgentStore((s) => s.handoffMessage);

  const businessName = useOnboardingStore((s) => s.businessName);
  const businessNiche = useOnboardingStore((s) => s.businessNiche);
  const aiAnalysis = useOnboardingStore((s) => s.aiAnalysis);
  const policiesInput = useOnboardingStore((s) => s.policiesInput);

  const fallbackGreeting = getDefaultGreeting(agentName, businessName);
  const initialGreeting = greeting.trim() || fallbackGreeting;

  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: "greeting", role: "assistant", content: initialGreeting },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState("");

  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const idCounter = useRef(1);

  const scrollToBottom = useCallback(() => {
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, scrollToBottom]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const sendMessage = async () => {
    const content = input.trim();
    if (!content || isTyping) return;

    const userMessage: ChatMessage = {
      id: `m${idCounter.current++}`,
      role: "user",
      content,
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setError("");
    setIsTyping(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          context: {
            businessName,
            businessNiche,
            agentName,
            personalityId,
            enabledCategories,
            handoffMessage,
            baseSystemPrompt: aiAnalysis?.systemPrompt,
            policiesExcerpt:
              aiAnalysis?.summary?.trim() || policiesInput.trim().slice(0, 500),
          },
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong.");
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `m${idCounter.current++}`,
          role: "assistant",
          content: data.content,
        },
      ]);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong. Try again."
      );
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex h-dvh flex-col bg-background">
      {/* Header */}
      <header className="flex items-center gap-3 border-b border-border bg-card px-4 py-3 sm:px-6">
        <AgentAvatar avatarId={avatarId} size="md" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">
            {agentName.trim() || "Your agent"}
          </p>
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-lime-500" />
            Online · {businessName.trim() || "your business"}
          </p>
        </div>
        <span className="rounded-full border border-border bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
          Test mode
        </span>
      </header>

      {/* Messages */}
      <div
        ref={listRef}
        className="flex-1 overflow-y-auto px-4 py-6 sm:px-6"
      >
        <div className="mx-auto flex max-w-2xl flex-col gap-4">
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              avatarId={avatarId}
            />
          ))}

          {isTyping && <TypingIndicator avatarId={avatarId} />}

          {error && (
            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="self-center rounded-full border border-destructive/30 bg-destructive/5 px-4 py-2 text-sm text-destructive"
            >
              {error}
            </motion.p>
          )}
        </div>
      </div>

      {/* Composer */}
      <footer className="border-t border-border bg-card px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-2xl items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask your agent a question…"
            maxLength={500}
            className={cn(
              "flex h-11 flex-1 rounded-xl border border-input bg-muted px-4 text-base text-foreground",
              "placeholder:text-muted-foreground",
              "transition-[border-color] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]",
              "focus:border-primary focus:outline-none",
              "hover:border-primary/30"
            )}
          />
          <button
            type="button"
            onClick={sendMessage}
            disabled={!input.trim() || isTyping}
            aria-label="Send message"
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-[background-color,transform] duration-150 ease-[cubic-bezier(0.23,1,0.32,1)]",
              "active:scale-[0.96]",
              input.trim() && !isTyping
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "cursor-not-allowed bg-muted text-muted-foreground/40"
            )}
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <path
                d="M5 12h13M13 6l6 6-6 6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </footer>
    </div>
  );
}
