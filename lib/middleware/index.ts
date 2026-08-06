/**
 * C-Support — Middleware Engine
 *
 * Public API — import from here, not from individual modules.
 */

export { processMessage, clearConversationState, getConversationFlowInfo } from "./pipeline";
export { detectTopic, getCategoryFromIntent } from "./topic-detector";
export { checkScope, buildHandoffMessage } from "./scope-checker";
export { buildContext } from "./context-builder";
export { generateResponse } from "./response-generator";
export { validateResponse, rewriteResponse } from "./output-validator";
export { updateConversationState, createInitialState } from "./conversation-state";
export { analyzePolicies } from "./onboarding-engine";

// Re-export types
export type {
  MiddlewareInput,
  MiddlewareOutput,
  TopicContext,
  ScopeCheckResult,
  AssembledContext,
  ResponseQuality,
  ValidationResult,
  ConversationState,
  ConversationStateUpdate,
  BusinessContext,
  AgentConfig,
  OnboardingAnalysis,
} from "./types";
