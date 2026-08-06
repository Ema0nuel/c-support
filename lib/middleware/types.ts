/**
 * C-Support — Middleware Engine Types
 *
 * Shared type definitions for the entire middleware pipeline.
 * All stages communicate through these types.
 */

import type { Intent, Sentiment, ClassifiedIntent } from "@/lib/intent-classifier";
import type { LocalMessage } from "@/lib/conversations";

// ── Business Context ──────────────────────────────

export interface BusinessContext {
  businessName: string;
  businessNiche: string;
  businessOrigin: string;
  policiesInput: string;
  suggestedPolicies?: Array<{ category: string; description: string }>;
}

export interface AgentConfig {
  personalityId: string;
  enabledCategories: string[];
  handoffMessage: string;
  agentName: string;
}

// ── Pipeline Input/Output ─────────────────────────

export interface MiddlewareInput {
  message: string;
  conversationHistory: LocalMessage[];
  businessContext: BusinessContext;
  agentConfig: AgentConfig;
}

export interface MiddlewareOutput {
  response: string;
  topic: TopicContext;
  scopeCheck: ScopeCheckResult;
  qualityScore: ResponseQuality;
  stateUpdate: ConversationStateUpdate;
}

// ── Stage 1: Topic Detection ──────────────────────

export interface TopicContext {
  /** The detected intent from the intent classifier */
  classifiedIntent: ClassifiedIntent;
  /** The original user message */
  rawMessage: string;
  /** Auto-detected category (free-form, not from hardcoded list) */
  detectedCategory: string;
  /** Keywords extracted from the message */
  keywords: string[];
  /** Extracted entities (order numbers, emails, etc.) */
  entities: Entity[];
  /** Whether this is a follow-up to a previous topic */
  isFollowUp: boolean;
  /** The category of the prior topic (if follow-up) */
  priorCategory: string | null;
  /** Whether the prior topic was resolved */
  priorTopicResolved: boolean;
  /** Number of turns in the current topic */
  topicTurnCount: number;
  /** Detected patterns in the conversation */
  patterns: DetectedPattern[];
}

export interface Entity {
  type: "order_number" | "email" | "phone" | "product" | "date" | "amount" | "url";
  value: string;
  start: number;
  end: number;
}

export interface DetectedPattern {
  type:
    | "repeated_question"    // user asked the same thing twice
    | "escalation_trajectory" // sentiment getting worse over time
    | "topic_switch"          // user jumped to a new topic
    | "resolution_attempt"    // system tried to resolve but user is still asking
    | "frustration_buildup"   // multiple negative sentiment messages
    | "information_seeking"   // user is gathering info (multiple questions)
    | "transactional";        // user wants to complete an action (buy, return, etc.)
  confidence: number;
  detail: string;
}

// ── Stage 2: Scope Check ──────────────────────────

export interface ScopeCheckResult {
  /** Whether the detected topic is within the business's scope */
  isInScope: boolean;
  /** The matched business category (if in scope) */
  matchedCategory: string | null;
  /** Confidence score (0-1) */
  confidence: number;
  /** Whether it's safe to answer despite being out-of-scope */
  safeToAnswer: boolean;
  /** Whether to hand off to a human agent */
  handoffNeeded: boolean;
  /** Reason for the scope decision */
  reason: string;
}

// ── Stage 3: Context Assembly ──────────────────────

export interface AssembledContext {
  /** The system prompt for the LLM */
  systemPrompt: string;
  /** Relevant policies for the current topic */
  relevantPolicies: string[];
  /** Summarized conversation history */
  historySummary: string;
  /** Topic continuity narrative */
  topicNarrative: string;
  /** The user's current message */
  userMessage: string;
  /** Full message array for LLM */
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>;
}

// ── Stage 5: Output Validation ────────────────────

export interface ResponseQuality {
  /** How well the response adheres to business policies (0-1) */
  policyAdherence: number;
  /** Risk of hallucination (0-1, lower = safer) */
  hallucinationRisk: number;
  /** How well the response continues the topic (0-1) */
  topicContinuity: number;
  /** Tone appropriateness (0-1) */
  toneScore: number;
  /** Overall quality (0-1) */
  overall: number;
}

export interface ValidationResult {
  /** Whether the response passed all checks */
  passed: boolean;
  /** Quality scores */
  quality: ResponseQuality;
  /** Whether the response needs to be rewritten */
  needsRewrite: boolean;
  /** Specific issues found */
  issues: ValidationIssue[];
}

export interface ValidationIssue {
  type: "hallucination" | "policy_violation" | "off_topic" | "tone_mismatch" | "incomplete" | "policy_leak";
  severity: "low" | "medium" | "high";
  description: string;
  suggestion: string;
}

// ── Stage 6: Conversation State ────────────────────

export interface TopicEntry {
  category: string;
  startedAt: number;
  resolved: boolean;
  turnCount: number;
  intentHistory: Intent[];
}

export interface ResolutionEntry {
  category: string;
  resolvedAt: number;
  turnCount: number;
}

export interface ConversationState {
  /** All topics discussed in this conversation */
  topics: TopicEntry[];
  /** Index of the current active topic */
  currentTopicIndex: number;
  /** Total turns in the conversation */
  totalTurns: number;
  /** History of resolved topics */
  resolutionHistory: ResolutionEntry[];
  /** Last activity timestamp */
  lastActivityAt: number;
}

export interface ConversationStateUpdate {
  /** Updated conversation state */
  state: ConversationState;
  /** Whether we should ask a follow-up question */
  shouldAskFollowUp: boolean;
  /** Whether we should hand off to a human */
  shouldHandoff: boolean;
  /** Flow control decision */
  flowDecision: "continue" | "follow_up" | "handoff" | "close";
}

// ── Onboarding Engine ──────────────────────────────

export interface OnboardingAnalysis {
  /** Auto-detected categories (free-form, no whitelist) */
  matchedCategories: string[];
  /** Structured policies with categories and descriptions */
  suggestedPolicies: Array<{
    category: string;
    description: string;
    keywords: string[];
    priority: "high" | "medium" | "low";
  }>;
  /** Auto-generated system prompt */
  systemPrompt: string;
  /** Summary of what the policies cover */
  summary: string;
  /** Validation results */
  validation: OnboardingValidation;
}

export interface OnboardingValidation {
  /** Whether the analysis is consistent */
  isConsistent: boolean;
  /** Whether categories match the policies */
  categoriesMatchPolicies: boolean;
  /** Whether the system prompt is accurate */
  systemPromptAccurate: boolean;
  /** Issues found */
  issues: string[];
}
