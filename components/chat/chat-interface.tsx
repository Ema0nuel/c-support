"use client";

import { useEffect, useCallback, useRef } from "react";
import { useAgentStore } from "@/store/agent";
import { useOnboardingStore } from "@/store/onboarding";
import { useChatStore } from "@/store/chat";
import { getDefaultGreeting } from "@/lib/agent";
import { createConversation, addMessage } from "@/lib/conversations";
import { processMessage, type MiddlewareInput, type MiddlewareOutput } from "@/lib/middleware";
import { ChatHeader } from "./chat-header";
import { ChatMessages } from "./chat-messages";
import { ChatComposer } from "./chat-composer";

/**
 * C-Support — Chat Interface
 *
 * Full-page chat experience opened in a new tab from the dashboard.
 *
 * Lifecycle:
 * 1. Hydration gate — wait for both Zustand stores to rehydrate
 * 2. Auto-send greeting as first assistant message (if conversation empty)
 * 3. User sends message → localStorage conversation created → typing indicator
 * 4. Simulated response (1.2–1.8 s delay) → persisted to localStorage
 *
 * Layout: ChatHeader (flex-shrink:0) + ChatMessages (flex:1) + ChatComposer (flex-shrink:0)
 */
export function ChatInterface() {
  // ── Zustand: agent config ────────────────────────
  const agentName = useAgentStore((s) => s.agentName);
  const avatarId = useAgentStore((s) => s.avatarId);
  const greeting = useAgentStore((s) => s.greeting);
  const personalityId = useAgentStore((s) => s.personalityId);
  const agentHydrated = useAgentStore((s) => s._hasHydrated);

  // ── Zustand: onboarding config ───────────────────
  const businessName = useOnboardingStore((s) => s.businessName);
  const businessNiche = useOnboardingStore((s) => s.businessNiche);
  const businessOrigin = useOnboardingStore((s) => s.businessOrigin);
  const policiesInput = useOnboardingStore((s) => s.policiesInput);
  const aiAnalysis = useOnboardingStore((s) => s.aiAnalysis);
  const onboardingHydrated = useOnboardingStore((s) => s._hasHydrated);

  // ── Zustand: chat state ──────────────────────────
  const messages = useChatStore((s) => s.messages);
  const isLoading = useChatStore((s) => s.isLoading);
  const chatHydrated = useChatStore((s) => s._hasHydrated);
  const addUserMessage = useChatStore((s) => s.addUserMessage);
  const addAssistantMessage = useChatStore((s) => s.addAssistantMessage);
  const setLoading = useChatStore((s) => s.setLoading);
  const setConversationId = useChatStore((s) => s.setConversationId);

  // ── Derived ──────────────────────────────────────
  const isHydrated = agentHydrated && onboardingHydrated && chatHydrated;
  const displayName = agentName.trim() || "Agent";
  const resolvedGreeting =
    greeting.trim() || getDefaultGreeting(agentName, businessName);

  // Track whether greeting has been sent to avoid double-fire
  const greetingSent = useRef(false);

  // Track conversation topic history for context-aware responses
  // (now managed by the middleware pipeline's conversation state)

  // ── Greeting auto-send ───────────────────────────
  useEffect(() => {
    if (!isHydrated) return;
    if (greetingSent.current) return;
    if (messages.length > 0) return;

    greetingSent.current = true;

    // Add greeting as first assistant message
    addAssistantMessage(resolvedGreeting);

    // If no conversation exists yet, create one in localStorage
    const activeConvoId = useChatStore.getState().conversationId;
    if (!activeConvoId) {
      const convo = createConversation(resolvedGreeting);
      setConversationId(convo.id);
      addMessage(convo.id, {
        role: "assistant",
        content: resolvedGreeting,
      });
    }
  }, [
    isHydrated,
    messages.length,
    resolvedGreeting,
    addAssistantMessage,
    setConversationId,
  ]);

  // ── Send handler ─────────────────────────────────
  const handleSend = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) return;

      // 1. Add user message to Zustand store
      addUserMessage(content);

      // 2. Ensure conversation exists in localStorage
      let activeConvoId = useChatStore.getState().conversationId;
      if (!activeConvoId) {
        const convo = createConversation(content);
        activeConvoId = convo.id;
        setConversationId(convo.id);
      }

      // Persist user message to localStorage
      addMessage(activeConvoId, {
        role: "user",
        content,
      });

      // 3. Show typing indicator
      setLoading(true);

      // 4. Run middleware pipeline
      const currentMessages = useChatStore.getState().messages;
      const conversationHistory = currentMessages.map((m) => ({
        id: m.id,
        role: m.role as "user" | "assistant",
        content: m.content,
        timestamp: m.timestamp,
      }));

      const middlewareInput: MiddlewareInput = {
        message: content,
        conversationHistory,
        businessContext: {
          businessName,
          businessNiche,
          businessOrigin,
          policiesInput,
          suggestedPolicies: aiAnalysis?.suggestedPolicies,
        },
        agentConfig: {
          personalityId,
          enabledCategories: useAgentStore.getState().enabledCategories,
          handoffMessage: useAgentStore.getState().handoffMessage,
          agentName: useAgentStore.getState().agentName,
        },
      };

      // Simulate realistic response time
      const delay = 1200 + Math.random() * 600;
      await new Promise((r) => setTimeout(r, delay));

      const result: MiddlewareOutput = await processMessage(
        middlewareInput,
        activeConvoId
      );

      // 5. Add assistant message
      addAssistantMessage(result.response);
      setLoading(false);

      // 6. Persist assistant message to localStorage
      const currentConvoId = useChatStore.getState().conversationId;
      if (currentConvoId) {
        addMessage(currentConvoId, {
          role: "assistant",
          content: result.response,
          responseTime: Math.round(delay),
        });
      }
    },
    [
      isLoading,
      addUserMessage,
      addAssistantMessage,
      setLoading,
      setConversationId,
      businessName,
      businessNiche,
      businessOrigin,
      policiesInput,
      aiAnalysis,
      personalityId,
    ]
  );

  // ── Loading / hydration spinner ──────────────────
  if (!isHydrated) {
    return (
      <div className="flex h-dvh items-center justify-center bg-background">
        <div className="cs-loader h-6 w-6 rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  // ── Main layout ──────────────────────────────────
  return (
    <div className="flex h-dvh flex-col bg-background">
      <ChatHeader agentName={displayName} avatarId={avatarId} />
      <ChatMessages
        messages={messages}
        isHydrated={isHydrated}
        isLoading={isLoading}
        avatarId={avatarId}
      />
      <ChatComposer onSend={handleSend} disabled={isLoading} />
    </div>
  );
}
