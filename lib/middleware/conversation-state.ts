/**
 * C-Support — Conversation State Tracker (Stage 6)
 *
 * Tracks conversation state across turns:
 * - Topic history and resolution status
 * - Turn counting per topic
 * - Flow control decisions (continue, follow-up, handoff, close)
 *
 * State is persisted in localStorage via the conversations store.
 */

import type {
  TopicContext,
  TopicEntry,
  ResolutionEntry,
  ConversationState,
  ConversationStateUpdate,
} from "./types";
import type { LocalMessage } from "@/lib/conversations";
import type { Intent } from "@/lib/intent-classifier";

// ── Default State ─────────────────────────────────

export function createInitialState(): ConversationState {
  return {
    topics: [],
    currentTopicIndex: -1,
    totalTurns: 0,
    resolutionHistory: [],
    lastActivityAt: Date.now(),
  };
}

// ── State Update ──────────────────────────────────

export function updateConversationState(
  state: ConversationState,
  topic: TopicContext,
  response: string
): ConversationStateUpdate {
  const now = Date.now();
  const intent = topic.classifiedIntent.intent;
  const category = topic.detectedCategory;

  // Skip state updates for greetings, acknowledgments, thank yous
  const nonTrackableIntents = ["greeting", "thank_you", "acknowledgment"];
  if (nonTrackableIntents.includes(intent)) {
    return {
      state: { ...state, lastActivityAt: now },
      shouldAskFollowUp: false,
      shouldHandoff: false,
      flowDecision: "continue",
    };
  }

  // Find or create topic entry
  let topics = [...state.topics];
  let currentTopicIndex = state.currentTopicIndex;

  // Check if this is a continuation of the current topic
  if (currentTopicIndex >= 0 && currentTopicIndex < topics.length) {
    const currentTopic = topics[currentTopicIndex];
    if (currentTopic.category === category && !currentTopic.resolved) {
      // Same topic — increment turn count
      topics[currentTopicIndex] = {
        ...currentTopic,
        turnCount: currentTopic.turnCount + 1,
        intentHistory: [...currentTopic.intentHistory, intent as Intent],
      };
    } else {
      // Different topic — resolve the old one and start a new one
      if (!currentTopic.resolved) {
        topics[currentTopicIndex] = { ...currentTopic, resolved: true };
        const resolution: ResolutionEntry = {
          category: currentTopic.category,
          resolvedAt: now,
          turnCount: currentTopic.turnCount,
        };
        topics = [...topics];
        const newTopic: TopicEntry = {
          category,
          startedAt: now,
          resolved: false,
          turnCount: 1,
          intentHistory: [intent as Intent],
        };
        topics.push(newTopic);
        currentTopicIndex = topics.length - 1;

        return {
          state: {
            topics,
            currentTopicIndex,
            totalTurns: state.totalTurns + 1,
            resolutionHistory: [...state.resolutionHistory, resolution],
            lastActivityAt: now,
          },
          shouldAskFollowUp: false,
          shouldHandoff: false,
          flowDecision: "continue",
        };
      }
    }
  } else {
    // No current topic — start a new one
    const newTopic: TopicEntry = {
      category,
      startedAt: now,
      resolved: false,
      turnCount: 1,
      intentHistory: [intent as Intent],
    };
    topics.push(newTopic);
    currentTopicIndex = topics.length - 1;
  }

  // Determine flow control
  const currentTopic = topics[currentTopicIndex];
  const turnCount = currentTopic?.turnCount || 1;

  // ── Flow Control Logic ──

  // If the topic has been discussed for many turns without resolution
  if (turnCount >= 5) {
    return {
      state: {
        topics,
        currentTopicIndex,
        totalTurns: state.totalTurns + 1,
        resolutionHistory: state.resolutionHistory,
        lastActivityAt: now,
      },
      shouldAskFollowUp: false,
      shouldHandoff: true,
      flowDecision: "handoff",
    };
  }

  // If patterns indicate frustration or escalation
  const hasEscalation = topic.patterns.some(
    (p) => p.type === "escalation_trajectory" || p.type === "frustration_buildup"
  );
  if (hasEscalation && turnCount >= 2) {
    return {
      state: {
        topics,
        currentTopicIndex,
        totalTurns: state.totalTurns + 1,
        resolutionHistory: state.resolutionHistory,
        lastActivityAt: now,
      },
      shouldAskFollowUp: false,
      shouldHandoff: true,
      flowDecision: "handoff",
    };
  }

  // If the response contains resolution keywords, mark topic as resolved
  const resolutionKeywords = [
    "is there anything else", "anything else i can help",
    "is that all", "anything more", "can i help with anything else",
    "glad i could help", "happy to help", "resolved",
  ];
  const responseLower = response.toLowerCase();
  const hasResolutionClosing = resolutionKeywords.some((kw) => responseLower.includes(kw));

  if (hasResolutionClosing && turnCount >= 2) {
    topics[currentTopicIndex] = { ...currentTopic, resolved: true };
    const resolution: ResolutionEntry = {
      category: currentTopic.category,
      resolvedAt: now,
      turnCount: currentTopic.turnCount,
    };

    return {
      state: {
        topics,
        currentTopicIndex,
        totalTurns: state.totalTurns + 1,
        resolutionHistory: [...state.resolutionHistory, resolution],
        lastActivityAt: now,
      },
      shouldAskFollowUp: true,
      shouldHandoff: false,
      flowDecision: "follow_up",
    };
  }

  // Default: continue the conversation
  return {
    state: {
      topics,
      currentTopicIndex,
      totalTurns: state.totalTurns + 1,
      resolutionHistory: state.resolutionHistory,
      lastActivityAt: now,
    },
    shouldAskFollowUp: false,
    shouldHandoff: false,
    flowDecision: "continue",
  };
}

// ── State Deserialization ─────────────────────────
// Convert a plain object from localStorage back to proper types

export function deserializeState(data: unknown): ConversationState {
  if (!data || typeof data !== "object") return createInitialState();
  const obj = data as Record<string, unknown>;
  return {
    topics: Array.isArray(obj.topics) ? obj.topics as TopicEntry[] : [],
    currentTopicIndex: typeof obj.currentTopicIndex === "number" ? obj.currentTopicIndex : -1,
    totalTurns: typeof obj.totalTurns === "number" ? obj.totalTurns : 0,
    resolutionHistory: Array.isArray(obj.resolutionHistory) ? obj.resolutionHistory as ResolutionEntry[] : [],
    lastActivityAt: typeof obj.lastActivityAt === "number" ? obj.lastActivityAt : Date.now(),
  };
}
