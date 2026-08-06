/**
 * C-Support — Scope Checker (Stage 2)
 *
 * Compares detected topics against the business's auto-detected categories.
 * No hardcoded whitelist — categories come entirely from onboarding analysis.
 *
 * Decision flow:
 * 1. Is the detected category in the business's scope? → proceed
 * 2. If out-of-scope, can we answer safely without hallucination? → answer with caveat
 * 3. Otherwise → hand off to human agent
 */

import type {
  TopicContext,
  ScopeCheckResult,
  BusinessContext,
  AgentConfig,
} from "./types";

// ── Fuzzy Category Matching ───────────────────────
// Since business categories are free-form strings from the LLM,
// we need fuzzy matching to compare them against detected topics.

function normalizeCategory(cat: string): string {
  return cat
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenizeCategory(cat: string): Set<string> {
  const normalized = normalizeCategory(cat);
  return new Set(normalized.split(" ").filter((w) => w.length > 1).map(stemWord));
}

// ── Simple Stemmer ──────────────────────────────
// Strips common English suffixes so "refunds" matches "refund",
// "shipping" matches "ship", "cancellations" matches "cancel", etc.
// This is a simplified Porter Stemmer — good enough for customer-support vocabulary.

function stemWord(word: string): string {
  if (word.length <= 3) return word;

  // Order matters: try longer suffixes first
  const rules: Array<[RegExp, string]> = [
    [/izations?$/, "ize"],
    [/fulness$/, "ful"],
    [/ousness$/, "ous"],
    [/iveness$/, "ive"],
    [/ations?$/, "ate"],
    [/ments?$/, "ment"],
    [/nesses?$/, "ness"],
    [/tings?$/, "t"],
    [/lings?$/, "ling"],
    [/tings?$/, "t"],
    [/ies$/, "y"],
    [/ves$/, "f"],
    [/sses$/, "ss"],
    [/ness$/, ""],
    [/ment$/, ""],
    [/able$/, ""],
    [/ible$/, ""],
    [/ical$/, ""],
    [/ful$/, ""],
    [/ous$/, ""],
    [/ive$/, ""],
    [/ing$/, ""],
    [/tion$/, ""],
    [/sion$/, ""],
    [/ity$/, ""],
    [/ies$/, "y"],
    [/ed$/, ""],
    [/er$/, ""],
    [/ly$/, ""],
    [/es$/, ""],
    [/s$/, ""],
  ];

  for (const [pattern, replacement] of rules) {
    if (pattern.test(word)) {
      const result = word.replace(pattern, replacement);
      // Don't stem down to fewer than 3 chars
      if (result.length >= 3) return result;
    }
  }
  return word;
}

function categorySimilarity(a: string, b: string): number {
  const tokensA = tokenizeCategory(a);
  const tokensB = tokenizeCategory(b);

  if (tokensA.size === 0 || tokensB.size === 0) return 0;

  // Jaccard similarity on token sets
  const intersection = new Set([...tokensA].filter((t) => tokensB.has(t)));
  const union = new Set([...tokensA, ...tokensB]);

  return intersection.size / union.size;
}

// ── Topic-to-Category Matching ────────────────────
// Maps the system's internal topic categories to the business's
// free-form categories using semantic similarity.

const TOPIC_CATEGORY_ALIASES: Record<string, string[]> = {
  account: ["account", "registration", "login", "password", "profile", "user", "authentication", "signup", "signin"],
  orders: ["order", "purchase", "buying", "checkout", "cart", "transaction"],
  shipping: ["shipping", "delivery", "logistics", "dispatch", "courier", "tracking", "transit"],
  refunds: ["refund", "reimbursement", "money back", "charge back", "credit"],
  returns: ["return", "exchange", "swap", "replacement", "defective", "damaged", "broken"],
  complaints: ["complaint", "issue", "problem", "dissatisfaction", "quality", "service"],
  billing: ["billing", "invoice", "receipt", "charge", "statement", "payment record"],
  payments: ["payment", "pay", "card", "transaction", "checkout", "billing", "method"],
  subscriptions: ["subscription", "plan", "recurring", "membership", "renewal", "tier"],
  cancellations: ["cancel", "cancellation", "terminate", "deactivate", "stop"],
  products: ["product", "item", "catalog", "stock", "availability", "specification", "feature"],
  general: ["general", "info", "information", "contact", "hours", "about", "help"],
  escalation: ["escalation", "supervisor", "human", "agent", "manager", "complaint"],
};

function findBestCategoryMatch(
  detectedCategory: string,
  businessCategories: string[]
): { match: string | null; confidence: number } {
  // 1. Try exact match first
  const exactMatch = businessCategories.find(
    (bc) => normalizeCategory(bc) === normalizeCategory(detectedCategory)
  );
  if (exactMatch) return { match: exactMatch, confidence: 1.0 };

  // 2. Try alias expansion
  const aliases = TOPIC_CATEGORY_ALIASES[detectedCategory] || [detectedCategory];
  for (const alias of aliases) {
    for (const bc of businessCategories) {
      const sim = categorySimilarity(alias, bc);
      if (sim > 0.5) {
        return { match: bc, confidence: sim };
      }
    }
  }

  // 3. Try direct similarity
  let bestMatch: string | null = null;
  let bestScore = 0;

  for (const bc of businessCategories) {
    const sim = categorySimilarity(detectedCategory, bc);
    if (sim > bestScore) {
      bestScore = sim;
      bestMatch = bc;
    }
  }

  if (bestScore > 0.3) {
    return { match: bestMatch, confidence: bestScore };
  }

  return { match: null, confidence: 0 };
}

// ── Safe-to-Answer Check ──────────────────────────
// When a topic is out-of-scope, determine if we can still help
// without hallucinating or leaking data.

const SAFE_OUT_OF_SCOPE_TOPICS = new Set([
  "greeting",
  "thank_you",
  "acknowledgment",
  "help",
  "contact",
  "hours",
]);

function isSafeToAnswer(
  topic: TopicContext,
  businessContext: BusinessContext
): boolean {
  const intent = topic.classifiedIntent.intent;

  // Always safe: greetings, acknowledgments, thank yous
  if (SAFE_OUT_OF_SCOPE_TOPICS.has(intent)) return true;

  // Safe if the topic is related to general business info
  if (intent === "contact" || intent === "hours") return true;

  // Unsafe: specific transactional topics (orders, refunds, etc.)
  // without matching business categories
  const transactionalIntents = [
    "order_status", "order_cancel", "refund", "returns", "exchange",
    "delivery", "shipping", "billing", "payment", "subscription",
    "cancellation",
  ];
  if (transactionalIntents.includes(intent)) return false;

  // For unclear/unknown topics, allow a brief helpful response
  if (intent === "unclear") return true;

  // Default: safe to attempt a helpful response
  return true;
}

// ── Main Scope Check ──────────────────────────────

export function checkScope(
  topic: TopicContext,
  businessContext: BusinessContext,
  agentConfig: AgentConfig
): ScopeCheckResult {
  const intent = topic.classifiedIntent.intent;
  const businessCategories = [
    ...(businessContext.suggestedPolicies?.map((p) => p.category) ?? []),
  ];

  // Greetings and acknowledgments are always in scope
  if (["greeting", "thank_you", "acknowledgment", "help"].includes(intent)) {
    return {
      isInScope: true,
      matchedCategory: null,
      confidence: 1.0,
      safeToAnswer: true,
      handoffNeeded: false,
      reason: "General interaction — always in scope",
    };
  }

  // Escalation always triggers handoff
  if (intent === "escalation") {
    return {
      isInScope: false,
      matchedCategory: null,
      confidence: 1.0,
      safeToAnswer: false,
      handoffNeeded: true,
      reason: "Customer requested human agent escalation",
    };
  }

  // If no business categories are configured, everything is in scope
  if (businessCategories.length === 0) {
    return {
      isInScope: true,
      matchedCategory: null,
      confidence: 0.5,
      safeToAnswer: true,
      handoffNeeded: false,
      reason: "No business categories configured — defaulting to in-scope",
    };
  }

  // Find the best matching business category
  const { match, confidence } = findBestCategoryMatch(
    topic.detectedCategory,
    businessCategories
  );

  if (match && confidence >= 0.3) {
    return {
      isInScope: true,
      matchedCategory: match,
      confidence,
      safeToAnswer: true,
      handoffNeeded: false,
      reason: `Topic matches business category "${match}" (confidence: ${Math.round(confidence * 100)}%)`,
    };
  }

  // Out-of-scope: check if safe to answer
  const safe = isSafeToAnswer(topic, businessContext);

  if (safe) {
    return {
      isInScope: false,
      matchedCategory: null,
      confidence,
      safeToAnswer: true,
      handoffNeeded: false,
      reason: `Topic "${topic.detectedCategory}" is out of scope but safe to answer generally`,
    };
  }

  // Out-of-scope and not safe: handoff needed
  return {
    isInScope: false,
    matchedCategory: null,
    confidence,
    safeToAnswer: false,
    handoffNeeded: true,
    reason: `Topic "${topic.detectedCategory}" is outside business scope — handoff recommended`,
  };
}

// ── Handoff Message Builder ───────────────────────

export function buildHandoffMessage(
  handoffTemplate: string,
  topic: TopicContext,
  businessContext: BusinessContext
): string {
  const biz = businessContext.businessName || "our team";

  if (handoffTemplate && handoffTemplate.trim()) {
    return handoffTemplate
      .replace(/\{biz\}/g, biz)
      .replace(/\{topic\}/g, topic.detectedCategory)
      .trim();
  }

  // Default handoff message
  return (
    `I appreciate you reaching out, but this question is outside my area of expertise. ` +
    `Let me connect you with a human agent at ${biz} who can better assist you with ${topic.detectedCategory}.\n\n` +
    `A team member will be with you shortly. Is there anything you'd like me to note about your issue before I transfer you?`
  );
}
