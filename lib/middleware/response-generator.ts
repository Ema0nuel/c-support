/**
 * C-Support — Response Generator (Stage 4)
 *
 * Generates responses using:
 * 1. LLM (primary) — calls OpenCode-Zen API
 * 2. Template engine (fallback) — uses response-engine.ts templates
 *
 * The LLM is the primary generator. Templates are only used
 * when the LLM is unavailable (no API key, timeout, error).
 */

import { callLLM, type Message } from "@/lib/chat";
import { generateResponse as templateGenerate, type PersonalityId } from "@/lib/response-engine";
import type { Intent } from "@/lib/intent-classifier";
import type {
  AssembledContext,
  TopicContext,
  BusinessContext,
} from "./types";

// ── Personality Adjustments ───────────────────────

function applyPersonality(
  response: string,
  personalityId: string
): string {
  switch (personalityId) {
    case "concise":
      return response
        .split("\n")
        .filter((line) => {
          const trimmed = line.trim();
          if (!trimmed) return false;
          if (/^[•\-\*]\s/.test(trimmed)) return false;
          if (/^\d+\.\s/.test(trimmed)) return false;
          return true;
        })
        .join("\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim();

    case "friendly":
      return response
        .replace(/^(Hello|Hi|Sure|Of course)/m, (_, match) => `${match}! 😊`)
        .replace(/Let me help/i, "I'd love to help")
        .replace(/I can help/i, "I'd be happy to help")
        .replace(/Could you/i, "Would you mind");

    case "empathetic":
      return response
        .replace(/I understand/i, "I completely understand how you feel")
        .replace(/I'm sorry to hear/i, "I'm truly sorry to hear")
        .replace(/I'm sorry/i, "I'm really sorry");

    case "professional":
    default:
      return response;
  }
}

// ── LLM Response Generation ──────────────────────

async function generateWithLLM(
  context: AssembledContext,
  personalityId: string
): Promise<string | null> {
  try {
    const response = await callLLM(context.messages as Message[]);
    if (!response || response.trim().length === 0) return null;

    // Apply personality adjustments
    return applyPersonality(response, personalityId);
  } catch {
    // LLM failed — return null to trigger fallback
    return null;
  }
}

// ── Template Fallback ─────────────────────────────

function generateWithTemplate(
  topic: TopicContext,
  businessContext: BusinessContext,
  personalityId: string
): string {
  // Map the middleware's topic context to the response engine's format
  const classified = topic.classifiedIntent;

  const convContext = {
    lastUserMessage: topic.rawMessage,
    lastAssistantMessage: undefined,
    topicHistory: topic.classifiedIntent.intent
      ? [topic.classifiedIntent.intent]
      : [],
    isFollowUp: topic.isFollowUp,
    priorIntent: topic.priorCategory as Intent | undefined,
  };

  return templateGenerate(
    classified,
    businessContext,
    personalityId as PersonalityId,
    convContext
  );
}

// ── Main Generator ────────────────────────────────

export async function generateResponse(
  context: AssembledContext,
  topic: TopicContext,
  businessContext: BusinessContext,
  personalityId: string
): Promise<string> {
  // Try LLM first
  const llmResponse = await generateWithLLM(context, personalityId);
  if (llmResponse) {
    return llmResponse;
  }

  // Fallback to template engine
  return generateWithTemplate(topic, businessContext, personalityId);
}
