/**
 * C-Support — Topic Detector (Stage 1)
 *
 * Wraps the existing intent classifier with additional layers:
 * - Pattern detection (repeated questions, escalation, topic switches)
 * - Entity extraction (order numbers, emails, phones, products)
 * - Topic context building (follow-up detection, resolution tracking)
 *
 * Builds on top of lib/intent-classifier.ts — does NOT replace it.
 */

import { classifyIntent, type ClassifiedIntent } from "@/lib/intent-classifier";
import type {
  TopicContext,
  Entity,
  DetectedPattern,
} from "./types";
import type { LocalMessage } from "@/lib/conversations";

// ── Intent → Category Mapping ─────────────────────
// Maps intent types to human-readable categories.
// These are NOT the business's categories — they're the system's
// internal topic labels. The scope checker compares these against
// the business's auto-detected categories.

const INTENT_TO_CATEGORY: Record<string, string> = {
  greeting: "general",
  account_signup: "account",
  account_login: "account",
  account_password: "account",
  account_close: "account",
  order_status: "orders",
  order_cancel: "orders",
  delivery: "shipping",
  shipping: "shipping",
  refund: "refunds",
  returns: "returns",
  exchange: "returns",
  complaint: "complaints",
  billing: "billing",
  payment: "payments",
  subscription: "subscriptions",
  cancellation: "cancellations",
  product: "products",
  contact: "general",
  hours: "general",
  thank_you: "general",
  help: "general",
  acknowledgment: "general",
  escalation: "escalation",
  unclear: "unclear",
};

// ── Entity Extraction ─────────────────────────────

const ENTITY_PATTERNS: Array<{
  type: Entity["type"];
  regex: RegExp;
}> = [
  { type: "order_number", regex: /\b(?:order|ord|#)\s*(?:no\.?|number)?\s*:?\s*([A-Z0-9]{6,20})\b/gi },
  { type: "order_number", regex: /\b\d{8,12}\b/g }, // plain numeric order IDs
  { type: "email", regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g },
  { type: "phone", regex: /\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}\b/g },
  { type: "product", regex: /\b(?:product|item|sku)\s*:?\s*([A-Z0-9][-A-Z0-9]{2,20})\b/gi },
  { type: "date", regex: /\b(?:\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})\b/g },
  { type: "amount", regex: /\b(?:\$|€|£|₦)\s*\d+(?:[.,]\d{2})?\b/g },
  { type: "url", regex: /\bhttps?:\/\/[^\s]+/gi },
];

function extractEntities(message: string): Entity[] {
  const entities: Entity[] = [];
  const seen = new Set<string>();

  for (const { type, regex } of ENTITY_PATTERNS) {
    // Reset regex lastIndex for global patterns
    regex.lastIndex = 0;
    let match;
    while ((match = regex.exec(message)) !== null) {
      const value = match[1] || match[0];
      const key = `${type}:${value}`;
      if (!seen.has(key)) {
        seen.add(key);
        entities.push({
          type,
          value: value.trim(),
          start: match.index,
          end: match.index + match[0].length,
        });
      }
    }
  }

  return entities;
}

// ── Pattern Detection ─────────────────────────────

function detectPatterns(
  message: string,
  classified: ClassifiedIntent,
  history: LocalMessage[]
): DetectedPattern[] {
  const patterns: DetectedPattern[] = [];

  if (history.length < 2) return patterns;

  const recentMessages = history.slice(-6);
  const recentIntents = recentMessages
    .filter((m) => m.role === "user")
    .map((m) => classifyIntent(m.content));

  // ── Repeated Question Detection ──
  // Check if the user is asking the same thing again
  const currentWords = new Set(message.toLowerCase().split(/\s+/));
  for (let i = 0; i < recentIntents.length - 1; i++) {
    const prevClassified = recentIntents[i];
    if (prevClassified.intent === classified.intent && classified.intent !== "greeting" && classified.intent !== "acknowledgment") {
      const overlap = [...currentWords].filter((w) =>
        recentMessages[i]?.content.toLowerCase().split(/\s+/).includes(w)
      ).length;
      const totalWords = Math.max(currentWords.size, 1);
      if (overlap / totalWords > 0.5) {
        patterns.push({
          type: "repeated_question",
          confidence: Math.min(0.5 + overlap / totalWords * 0.5, 1),
          detail: `User appears to be repeating a ${classified.intent} question`,
        });
        break;
      }
    }
  }

  // ── Escalation Trajectory ──
  // Check if sentiment is getting worse over time
  const sentiments = recentMessages
    .filter((m) => m.role === "user")
    .map((m) => classifyIntent(m.content).sentiment);

  const sentimentScores = { neutral: 0, confused: 1, frustrated: 2, angry: 3, urgent: 2 };
  const recentScores = sentiments.slice(-3).map((s) => sentimentScores[s] ?? 0);

  if (recentScores.length >= 2) {
    const avgFirst = recentScores.slice(0, Math.floor(recentScores.length / 2)).reduce((a, b) => a + b, 0) / Math.max(1, Math.floor(recentScores.length / 2));
    const avgSecond = recentScores.slice(Math.floor(recentScores.length / 2)).reduce((a, b) => a + b, 0) / Math.max(1, recentScores.length - Math.floor(recentScores.length / 2));

    if (avgSecond > avgFirst + 0.5) {
      patterns.push({
        type: "escalation_trajectory",
        confidence: Math.min((avgSecond - avgFirst) / 3, 1),
        detail: `Sentiment escalating from ${sentiments[sentiments.length - 2]} to ${sentiments[sentiments.length - 1]}`,
      });
    }
  }

  // ── Topic Switch Detection ──
  if (recentIntents.length >= 2) {
    const prevIntent = recentIntents[recentIntents.length - 1];
    const prevCategory = INTENT_TO_CATEGORY[prevIntent.intent] || "general";
    const currentCategory = INTENT_TO_CATEGORY[classified.intent] || "general";

    if (prevCategory !== currentCategory && prevCategory !== "general" && currentCategory !== "general" && prevCategory !== "unclear") {
      patterns.push({
        type: "topic_switch",
        confidence: 0.8,
        detail: `Topic switched from ${prevCategory} to ${currentCategory}`,
      });
    }
  }

  // ── Resolution Attempt Detection ──
  // Check if the system previously provided a solution and user is still asking
  const assistantMessages = recentMessages.filter((m) => m.role === "assistant");
  if (assistantMessages.length > 0) {
    const lastAssistant = assistantMessages[assistantMessages.length - 1];
    const resolutionKeywords = ["here are the steps", "try these", "you can", "please share", "could you provide"];
    const hasResolution = resolutionKeywords.some((kw) =>
      lastAssistant.content.toLowerCase().includes(kw)
    );

    if (hasResolution && classified.intent !== "acknowledgment" && classified.intent !== "thank_you") {
      patterns.push({
        type: "resolution_attempt",
        confidence: 0.6,
        detail: "System previously provided a resolution but user is still on the same topic",
      });
    }
  }

  // ── Frustration Buildup ──
  const negativeCount = sentiments.filter(
    (s) => s === "frustrated" || s === "angry"
  ).length;
  if (negativeCount >= 2) {
    patterns.push({
      type: "frustration_buildup",
      confidence: Math.min(negativeCount / 4, 1),
      detail: `${negativeCount} negative sentiment messages in recent history`,
    });
  }

  // ── Information Seeking ──
  const questionCount = recentMessages.filter(
    (m) => m.role === "user" && m.content.includes("?")
  ).length;
  if (questionCount >= 2) {
    patterns.push({
      type: "information_seeking",
      confidence: Math.min(questionCount / 4, 1),
      detail: `User asked ${questionCount} questions in recent messages`,
    });
  }

  // ── Transactional Pattern ──
  const transactionalIntents = ["order_status", "order_cancel", "refund", "returns", "exchange", "delivery"];
  if (transactionalIntents.includes(classified.intent)) {
    patterns.push({
      type: "transactional",
      confidence: 0.7,
      detail: `User wants to complete a transactional action: ${classified.intent}`,
    });
  }

  return patterns;
}

// ── Follow-Up Detection ───────────────────────────

function detectFollowUp(
  classified: ClassifiedIntent,
  history: LocalMessage[],
  message: string
): { isFollowUp: boolean; priorCategory: string | null; topicTurnCount: number } {
  if (history.length < 2) {
    return { isFollowUp: false, priorCategory: null, topicTurnCount: 0 };
  }

  // Use the intent classifier's built-in follow-up detection
  if (classified.isFollowUp) {
    // Find the prior topic
    const userMessages = history.filter((m) => m.role === "user");
    if (userMessages.length >= 2) {
      const priorClassified = classifyIntent(userMessages[userMessages.length - 2].content);
      const priorCategory = INTENT_TO_CATEGORY[priorClassified.intent] || "general";
      const currentCategory = INTENT_TO_CATEGORY[classified.intent] || "general";

      // Count how many turns we've been on this topic
      let topicTurnCount = 0;
      for (let i = userMessages.length - 1; i >= 0; i--) {
        const msgClassified = classifyIntent(userMessages[i].content);
        const msgCategory = INTENT_TO_CATEGORY[msgClassified.intent] || "general";
        if (msgCategory === currentCategory || msgCategory === "general" || msgCategory === "unclear") {
          topicTurnCount++;
        } else {
          break;
        }
      }

      return { isFollowUp: true, priorCategory, topicTurnCount };
    }
  }

  // Also detect implicit follow-ups by checking if the current message
  // references something from the conversation history
  const lastAssistant = history.filter((m) => m.role === "assistant").at(-1);
  if (lastAssistant) {
    const followUpIndicators = [
      "but", "also", "and", "what about", "how about", "what about",
      "the other", "another", "more", "still", "also need",
    ];
    const messageLower = message.toLowerCase();
    if (followUpIndicators.some((ind) => messageLower.includes(ind))) {
      const currentCategory = INTENT_TO_CATEGORY[classified.intent] || "general";
      return { isFollowUp: true, priorCategory: currentCategory, topicTurnCount: 1 };
    }
  }

  return { isFollowUp: false, priorCategory: null, topicTurnCount: 0 };
}

// ── Main Detection Function ───────────────────────

export function detectTopic(
  message: string,
  conversationHistory: LocalMessage[]
): TopicContext {
  // 1. Classify intent using the existing classifier
  const recentHistory = conversationHistory.slice(-6).map((m) => ({
    role: m.role,
    content: m.content,
  }));
  const classified = classifyIntent(message, recentHistory);

  // 2. Map intent to category
  const detectedCategory = INTENT_TO_CATEGORY[classified.intent] || "general";

  // 3. Extract entities
  const entities = extractEntities(message);

  // 4. Detect patterns
  const patterns = detectPatterns(message, classified, conversationHistory);

  // 5. Detect follow-up and topic continuity
  const { isFollowUp, priorCategory, topicTurnCount } = detectFollowUp(classified, conversationHistory, message);

  // 6. Extract keywords (from the message, excluding stop words)
  const stopWords = new Set([
    "i", "me", "my", "myself", "we", "our", "ours", "ourselves", "you", "your",
    "yours", "yourself", "yourselves", "he", "him", "his", "himself", "she", "her",
    "hers", "herself", "it", "its", "itself", "they", "them", "their", "theirs",
    "themselves", "what", "which", "who", "whom", "this", "that", "these", "those",
    "am", "is", "are", "was", "were", "be", "been", "being", "have", "has", "had",
    "having", "do", "does", "did", "doing", "a", "an", "the", "and", "but", "if",
    "or", "because", "as", "until", "while", "of", "at", "by", "for", "with",
    "about", "against", "between", "through", "during", "before", "after", "above",
    "below", "to", "from", "up", "down", "in", "out", "on", "off", "over", "under",
    "again", "further", "then", "once", "here", "there", "when", "where", "why",
    "how", "all", "both", "each", "few", "more", "most", "other", "some", "such",
    "no", "nor", "not", "only", "own", "same", "so", "than", "too", "very", "s",
    "t", "can", "will", "just", "don", "should", "now", "d", "ll", "m", "o", "re",
    "ve", "y", "ain", "aren", "couldn", "didn", "doesn", "hadn", "hasn", "haven",
    "isn", "ma", "mightn", "mustn", "needn", "shan", "shouldn", "wasn", "weren",
    "won", "wouldn",
  ]);

  const keywords = message
    .toLowerCase()
    .split(/\s+/)
    .map((w) => w.replace(/[^a-z0-9]/g, ""))
    .filter((w) => w.length > 2 && !stopWords.has(w))
    .slice(0, 10);

  return {
    classifiedIntent: classified,
    rawMessage: message,
    detectedCategory,
    keywords,
    entities,
    isFollowUp,
    priorCategory,
    priorTopicResolved: false, // Will be updated by conversation state
    topicTurnCount,
    patterns,
  };
}

// ── Utility: Get category from intent ─────────────

export function getCategoryFromIntent(intent: string): string {
  return INTENT_TO_CATEGORY[intent] || "general";
}
