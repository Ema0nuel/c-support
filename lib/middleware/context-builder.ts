/**
 * C-Support — Context Builder (Stage 3)
 *
 * Assembles the full context for response generation:
 * 1. System prompt from business profile
 * 2. Relevant policies for the detected topic
 * 3. Summarized conversation history (not raw messages)
 * 4. Topic continuity narrative
 * 5. Current user message
 *
 * Key improvement over old system: Instead of passing raw messages,
 * we build a structured context that gives the LLM a clear picture
 * of what's happening in the conversation.
 */

import type {
  TopicContext,
  ScopeCheckResult,
  BusinessContext,
  AssembledContext,
} from "./types";
import type { LocalMessage } from "@/lib/conversations";

// ── Policy Search ─────────────────────────────────
// Enhanced version of findRelevantPolicies from response-engine.ts

function findRelevantPolicies(
  topic: TopicContext,
  businessContext: BusinessContext
): string[] {
  const results: string[] = [];
  const intent = topic.classifiedIntent.intent;
  const keywords = topic.keywords;

  // Build search terms from intent + keywords + entities
  const searchTerms: string[] = [];

  // Add intent-specific terms
  const INTENT_SEARCH_TERMS: Record<string, string[]> = {
    account_signup: ["account", "registration", "sign up", "create account"],
    account_login: ["login", "password", "account access", "sign in"],
    account_password: ["password", "reset password", "forgot password"],
    account_close: ["account closure", "delete account", "close account"],
    order_status: ["order", "tracking", "status", "dispatch", "shipment"],
    order_cancel: ["cancel", "cancellation", "order modification"],
    delivery: ["delivery", "shipping", "dispatch", "courier"],
    shipping: ["shipping", "delivery", "freight", "courier"],
    refund: ["refund", "money back", "reimbursement"],
    returns: ["return", "returns", "send back", "defective", "damaged"],
    exchange: ["exchange", "swap", "replace", "replacement"],
    complaint: ["complaint", "quality", "satisfaction", "service"],
    billing: ["billing", "invoice", "receipt", "charge"],
    payment: ["payment", "pay", "card", "transaction"],
    subscription: ["subscription", "plan", "renewal", "recurring"],
    cancellation: ["cancel", "cancellation", "terminate"],
    product: ["product", "item", "catalog", "stock", "availability"],
  };

  searchTerms.push(...(INTENT_SEARCH_TERMS[intent] || []));
  searchTerms.push(...keywords);

  // Add entity values as search terms
  for (const entity of topic.entities) {
    searchTerms.push(entity.value.toLowerCase());
  }

  if (searchTerms.length === 0) return results;

  // Search raw policy text
  if (businessContext.policiesInput) {
    const lines = businessContext.policiesInput.split(/\n/).filter((l) => l.trim());
    for (const line of lines) {
      const lower = line.toLowerCase();
      for (const term of searchTerms) {
        if (lower.includes(term)) {
          results.push(line.trim());
          break;
        }
      }
    }
  }

  // Search structured policies from AI analysis
  if (businessContext.suggestedPolicies) {
    for (const policy of businessContext.suggestedPolicies) {
      const catLower = policy.category.toLowerCase();
      const descLower = policy.description.toLowerCase();
      for (const term of searchTerms) {
        if (catLower.includes(term) || descLower.includes(term)) {
          const entry = `${policy.category}: ${policy.description}`;
          if (!results.includes(entry)) {
            results.push(entry);
          }
          break;
        }
      }
    }
  }

  return [...new Set(results)].slice(0, 5);
}

// ── History Summarization ─────────────────────────
// Instead of passing raw messages, we create a structured summary
// that tells the LLM what's been discussed and what's been resolved.

function summarizeHistory(
  history: LocalMessage[],
  topic: TopicContext
): string {
  if (history.length === 0) return "No previous conversation history.";

  const summaryParts: string[] = [];

  // Count messages by role
  const userMessages = history.filter((m) => m.role === "user");
  const assistantMessages = history.filter((m) => m.role === "assistant");

  // Summarize what was discussed
  const recentUserTopics = userMessages.slice(-4).map((m) => m.content);
  if (recentUserTopics.length > 0) {
    summaryParts.push("Recent customer messages:");
    for (const msg of recentUserTopics) {
      summaryParts.push(`  - "${msg.slice(0, 150)}${msg.length > 150 ? "..." : ""}"`);
    }
  }

  // Note what the assistant addressed
  if (assistantMessages.length > 0) {
    const lastAssistant = assistantMessages[assistantMessages.length - 1];
    summaryParts.push(`\nLast assistant response addressed: ${lastAssistant.content.slice(0, 200)}...`);
  }

  // Note detected patterns
  if (topic.patterns.length > 0) {
    const patternDescriptions = topic.patterns.map((p) => p.detail);
    summaryParts.push(`\nConversation patterns detected: ${patternDescriptions.join("; ")}`);
  }

  // Note resolution status
  if (topic.priorTopicResolved) {
    summaryParts.push("\nThe previous topic was resolved. This may be a new question.");
  } else if (topic.isFollowUp && topic.topicTurnCount > 1) {
    summaryParts.push(`\nThis is turn ${topic.topicTurnCount} on the current topic — the customer's issue is not yet resolved.`);
  }

  return summaryParts.join("\n");
}

// ── Topic Continuity Narrative ────────────────────
// Builds a narrative that tells the LLM about the conversation flow

function buildTopicNarrative(
  topic: TopicContext,
  scopeCheck: ScopeCheckResult
): string {
  const parts: string[] = [];

  // Current topic
  parts.push(`Current topic: ${topic.detectedCategory} (${topic.classifiedIntent.intent})`);
  parts.push(`Customer sentiment: ${topic.classifiedIntent.sentiment}`);

  if (topic.isFollowUp) {
    parts.push(`This is a follow-up to the previous topic: ${topic.priorCategory || "unknown"}`);
    if (topic.priorTopicResolved) {
      parts.push("The previous topic was resolved.");
    } else {
      parts.push("The previous topic was NOT yet resolved — continue addressing it.");
    }
  }

  // Entities
  if (topic.entities.length > 0) {
    const entityList = topic.entities.map((e) => `${e.type}: ${e.value}`).join(", ");
    parts.push(`Entities detected: ${entityList}`);
  }

  // Patterns
  if (topic.patterns.length > 0) {
    const patternList = topic.patterns.map((p) => `${p.type} (${Math.round(p.confidence * 100)}%)`).join(", ");
    parts.push(`Patterns: ${patternList}`);
  }

  // Scope
  if (!scopeCheck.isInScope) {
    parts.push(`Topic is outside business scope: ${scopeCheck.reason}`);
    if (scopeCheck.safeToAnswer) {
      parts.push("However, you may provide general helpful information without making specific business promises.");
    }
  }

  return parts.join("\n");
}

// ── System Prompt Builder ─────────────────────────

function buildSystemPrompt(
  businessContext: BusinessContext,
  scopeCheck: ScopeCheckResult,
  topic: TopicContext
): string {
  const name = businessContext.businessName || "our company";
  const niche = businessContext.businessNiche || "business";

  const basePrompt = (
    `You are a professional customer support agent for ${name}, a ${niche} company.\n\n` +
    `IMPORTANT RULES:\n` +
    `1. ALWAYS check the provided business policies before answering. If a policy directly addresses the customer's question, follow it exactly.\n` +
    `2. NEVER make up policies, prices, timelines, or promises that are not in the provided policies.\n` +
    `3. If the customer's issue is not covered by the policies, be honest about it and offer to connect them with a human agent.\n` +
    `4. Maintain the conversation topic — do not change the subject unless the customer does.\n` +
    `5. If the customer is frustrated or angry, acknowledge their feelings before providing a solution.\n` +
    `6. Provide complete solutions before asking "is there anything else?" — do not cut off mid-solution.\n` +
    `7. If the topic is outside the business scope, you may provide general helpful information but clearly state that specific policies may differ.\n` +
    `8. Use the conversation history to maintain context — do not ask the customer to repeat information they already provided.\n`
  );

  // Add scope-specific instructions
  if (!scopeCheck.isInScope && scopeCheck.safeToAnswer) {
    return (
      basePrompt +
      `\nNote: The customer's question is outside your specific business scope. ` +
      `You may provide general helpful information, but do NOT claim it represents ` +
      `${name}'s official policies. If you're unsure, offer to connect them with a human agent.\n`
    );
  }

  return basePrompt;
}

// ── Main Context Assembly ─────────────────────────

export function buildContext(
  topic: TopicContext,
  scopeCheck: ScopeCheckResult,
  businessContext: BusinessContext,
  conversationHistory: LocalMessage[]
): AssembledContext {
  // 1. System prompt
  const systemPrompt = buildSystemPrompt(businessContext, scopeCheck, topic);

  // 2. Relevant policies
  const relevantPolicies = findRelevantPolicies(topic, businessContext);

  // 3. Conversation history summary
  const historySummary = summarizeHistory(conversationHistory, topic);

  // 4. Topic continuity narrative
  const topicNarrative = buildTopicNarrative(topic, scopeCheck);

  // 5. Assemble message array for LLM
  const messages: AssembledContext["messages"] = [];

  // System prompt
  messages.push({ role: "system", content: systemPrompt });

  // Relevant policies (if any)
  if (relevantPolicies.length > 0) {
    const policyBlock = (
      `Relevant business policies for this topic:\n` +
      relevantPolicies.map((p, i) => `[${i + 1}] ${p}`).join("\n") +
      `\n\nUse these policies to answer the customer's question. If the policies don't cover the question, say so honestly.`
    );
    messages.push({ role: "system", content: policyBlock });
  }

  // Topic context
  messages.push({ role: "system", content: `Conversation context:\n${topicNarrative}` });

  // History summary
  if (historySummary !== "No previous conversation history.") {
    messages.push({ role: "system", content: `Previous conversation:\n${historySummary}` });
  }

  // Add the last few messages for direct context (limited to prevent token overflow)
  const recentMessages = conversationHistory.slice(-4);
  for (const msg of recentMessages) {
    messages.push({ role: msg.role === "assistant" ? "assistant" : "user", content: msg.content });
  }

  // Current user message
  messages.push({ role: "user", content: topic.rawMessage });

  return {
    systemPrompt,
    relevantPolicies,
    historySummary,
    topicNarrative,
    userMessage: topic.rawMessage,
    messages,
  };
}
