/**
 * C-Support — Middleware Pipeline (Main Orchestrator)
 *
 * Wires all 6 stages together into a single pipeline function.
 * This is the main entry point for the middleware engine.
 *
 * Pipeline flow:
 * 1. Topic Detection — classify intent, detect patterns, extract entities
 * 2. Scope Check — compare topic against business categories
 * 3. Context Assembly — build structured context for LLM
 * 4. Response Generation — call LLM or template fallback
 * 5. Output Validation — sub-agent checks for quality
 * 6. State Update — track topic, resolution, flow control
 */

import { detectTopic } from "./topic-detector";
import { checkScope, buildHandoffMessage } from "./scope-checker";
import { buildContext } from "./context-builder";
import { generateResponse } from "./response-generator";
import { validateResponse, rewriteResponse } from "./output-validator";
import {
  updateConversationState,
  createInitialState,
  deserializeState,
} from "./conversation-state";
import type {
  MiddlewareInput,
  MiddlewareOutput,
  ConversationState,
} from "./types";
import type { LocalMessage } from "@/lib/conversations";

// ── Conversation State Persistence ────────────────
// State is stored per-conversation in localStorage

const STATE_STORAGE_PREFIX = "c-support-conv-state-";

function loadConversationState(conversationId: string | null): ConversationState {
  if (!conversationId || typeof window === "undefined") {
    return createInitialState();
  }
  try {
    const raw = localStorage.getItem(`${STATE_STORAGE_PREFIX}${conversationId}`);
    if (!raw) return createInitialState();
    return deserializeState(JSON.parse(raw));
  } catch {
    return createInitialState();
  }
}

function saveConversationState(
  conversationId: string | null,
  state: ConversationState
): void {
  if (!conversationId || typeof window === "undefined") return;
  try {
    localStorage.setItem(
      `${STATE_STORAGE_PREFIX}${conversationId}`,
      JSON.stringify(state)
    );
  } catch {
    // Storage full — silently fail
  }
}

// ── Main Pipeline ─────────────────────────────────

export async function processMessage(
  input: MiddlewareInput,
  conversationId?: string | null
): Promise<MiddlewareOutput> {
  const {
    message,
    conversationHistory,
    businessContext,
    agentConfig,
  } = input;

  // Load existing conversation state
  const conversationState = loadConversationState(conversationId ?? null);

  // ── Stage 1: Topic Detection ──
  const topic = detectTopic(message, conversationHistory);

  // ── Stage 2: Scope Check ──
  const scopeCheck = checkScope(topic, businessContext, agentConfig);

  // If handoff needed, return handoff message immediately
  if (scopeCheck.handoffNeeded) {
    const handoffResponse = buildHandoffMessage(
      agentConfig.handoffMessage,
      topic,
      businessContext
    );

    const stateUpdate = updateConversationState(
      conversationState,
      topic,
      handoffResponse
    );

    // Save updated state
    saveConversationState(conversationId ?? null, stateUpdate.state);

    return {
      response: handoffResponse,
      topic,
      scopeCheck,
      qualityScore: {
        policyAdherence: 1.0,
        hallucinationRisk: 0,
        topicContinuity: 1.0,
        toneScore: 1.0,
        overall: 1.0,
      },
      stateUpdate,
    };
  }

  // ── Stage 3: Context Assembly ──
  const context = buildContext(topic, scopeCheck, businessContext, conversationHistory);

  // ── Stage 4: Response Generation ──
  let response = await generateResponse(
    context,
    topic,
    businessContext,
    agentConfig.personalityId
  );

  // ── Stage 5: Output Validation ──
  const validation = validateResponse(response, context, topic, businessContext, scopeCheck);

  // Rewrite if needed
  if (validation.needsRewrite) {
    response = rewriteResponse(response, validation, context);
  }

  // ── Stage 6: Conversation State Update ──
  const stateUpdate = updateConversationState(conversationState, topic, response);

  // Save updated state
  saveConversationState(conversationId ?? null, stateUpdate.state);

  return {
    response,
    topic,
    scopeCheck,
    qualityScore: validation.quality,
    stateUpdate,
  };
}

// ── Utility: Clear conversation state ─────────────

export function clearConversationState(conversationId: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(`${STATE_STORAGE_PREFIX}${conversationId}`);
  } catch {
    // Silently fail
  }
}

// ── Utility: Get conversation flow info ───────────

export function getConversationFlowInfo(conversationId: string | null): {
  topicCount: number;
  currentTopic: string | null;
  turnCount: number;
  unresolvedTopics: number;
} {
  const state = loadConversationState(conversationId);
  const unresolvedTopics = state.topics.filter((t) => !t.resolved).length;
  const currentTopic = state.currentTopicIndex >= 0
    ? state.topics[state.currentTopicIndex]?.category ?? null
    : null;

  return {
    topicCount: state.topics.length,
    currentTopic,
    turnCount: state.totalTurns,
    unresolvedTopics,
  };
}
