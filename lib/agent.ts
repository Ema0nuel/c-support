/**
 * C-Support — Agent Customization Shared Config
 *
 * Central source of truth for the 7-step agent customization flow:
 * step metadata (routes), personality options, avatar options,
 * default greeting/handoff, and the system-prompt builder used by
 * the chat API route.
 *
 * Pure data + pure functions — no React, no client-only APIs.
 * SVG renderers for avatars live in components/customize/agent-icons.tsx.
 */

// ──────────────────────────────────────────────────
// Customization Steps (routed)
// ──────────────────────────────────────────────────

export interface CustomizeStep {
  id: string;
  num: number; // 1-based position in the flow
  label: string;
  path: string;
  eyebrow: string; // short descriptor shown under the step number
}

export const CUSTOMIZE_STEPS: CustomizeStep[] = [
  {
    id: "name",
    num: 1,
    label: "Agent Name",
    path: "/customize/name",
    eyebrow: "Give your agent an identity",
  },
  {
    id: "personality",
    num: 2,
    label: "Personality",
    path: "/customize/personality",
    eyebrow: "Choose how it sounds",
  },
  {
    id: "greeting",
    num: 3,
    label: "Greeting",
    path: "/customize/greeting",
    eyebrow: "Set the first impression",
  },
  {
    id: "avatar",
    num: 4,
    label: "Avatar",
    path: "/customize/avatar",
    eyebrow: "Give it a face",
  },
  {
    id: "scope",
    num: 5,
    label: "Knowledge",
    path: "/customize/scope",
    eyebrow: "Define what it handles",
  },
  {
    id: "handoff",
    num: 6,
    label: "Handoff",
    path: "/customize/handoff",
    eyebrow: "Plan the fallback",
  },
  {
    id: "review",
    num: 7,
    label: "Review",
    path: "/customize/review",
    eyebrow: "Check everything",
  },
];

export const TOTAL_CUSTOMIZE_STEPS = CUSTOMIZE_STEPS.length;

const STEP_BY_ID = Object.fromEntries(
  CUSTOMIZE_STEPS.map((s) => [s.id, s])
) as Record<string, CustomizeStep>;

const STEP_BY_PATH = Object.fromEntries(
  CUSTOMIZE_STEPS.map((s) => [s.path, s])
) as Record<string, CustomizeStep>;

/** Resolve a customize step from its route path (e.g. "/customize/greeting"). */
export function stepFromPath(pathname: string): CustomizeStep | undefined {
  return STEP_BY_PATH[pathname];
}

/** Next step path for a step id, or null on the final step. */
export function nextPath(id: string): string | null {
  const step = STEP_BY_ID[id];
  if (!step || step.num >= TOTAL_CUSTOMIZE_STEPS) return null;
  return CUSTOMIZE_STEPS[step.num].path;
}

/** Previous step path for a step id, or null on the first step. */
export function prevPath(id: string): string | null {
  const step = STEP_BY_ID[id];
  if (!step || step.num <= 1) return null;
  return CUSTOMIZE_STEPS[step.num - 2].path;
}

// ──────────────────────────────────────────────────
// Personalities
// ──────────────────────────────────────────────────

export interface Personality {
  id: string;
  label: string;
  description: string;
  tone: string; // system-prompt fragment injected into the chat prompt
  sample: string; // live-preview reply shown on the personality step
}

export const PERSONALITIES: Personality[] = [
  {
    id: "professional",
    label: "Professional",
    description:
      "Clear, courteous and business-grade. Ideal for established companies.",
    tone: "Respond in a professional, courteous tone. Use complete sentences and precise, confident language. Never use slang.",
    sample:
      "Thank you for reaching out. Your refund has been approved and will appear within 5–7 business days. Is there anything else I can assist you with?",
  },
  {
    id: "friendly",
    label: "Friendly",
    description:
      "Warm and approachable — like a helpful colleague who knows the product.",
    tone: "Respond warmly and conversationally. Use friendly, natural language while staying genuinely helpful.",
    sample:
      "Hey there! Great news — your refund is on its way and should land in 5–7 business days. Happy to help with anything else!",
  },
  {
    id: "concise",
    label: "Concise",
    description:
      "Short, direct answers. No fluff — just the essential information first.",
    tone: "Be concise. Give short, direct answers with the essential information first. Avoid filler words and pleasantries.",
    sample: "Refund approved. Arrives in 5–7 business days.",
  },
  {
    id: "warm",
    label: "Warm",
    description:
      "Empathetic and reassuring — perfect for complaints and sensitive issues.",
    tone: "Respond with empathy and reassurance. Acknowledge the customer's concern before answering, and be patient and kind.",
    sample:
      "I'm really sorry about the trouble this has caused. I've approved your refund — it will reach you in 5–7 business days. Please don't hesitate to reach out again.",
  },
];

export function personalityById(id: string): Personality | undefined {
  return PERSONALITIES.find((p) => p.id === id);
}

// ──────────────────────────────────────────────────
// Avatars (metadata — renderers live in agent-icons.tsx)
// ──────────────────────────────────────────────────

export interface AvatarOption {
  id: string;
  label: string;
}

export const AVATARS: AvatarOption[] = [
  { id: "spark", label: "Spark" },
  { id: "hex", label: "Hex" },
  { id: "orbit", label: "Orbit" },
  { id: "bolt", label: "Bolt" },
  { id: "wave", label: "Wave" },
  { id: "frame", label: "Frame" },
];

// ──────────────────────────────────────────────────
// Defaults
// ──────────────────────────────────────────────────

/** Fallback scope when onboarding produced no aiAnalysis categories. */
export const DEFAULT_SCOPE = [
  "ORDER",
  "SHIPPING",
  "RETURNS",
  "REFUND",
  "PAYMENT",
  "ACCOUNT",
];

export function getDefaultGreeting(
  agentName: string,
  businessName: string
): string {
  const agent = agentName.trim() || "your support assistant";
  const business = businessName.trim() || "our company";
  return `Hi, I'm ${agent}, the support assistant for ${business}. How can I help you today?`;
}

/** Derive a safe email slug from a business name. */
function businessSlug(businessName: string): string {
  return (
    businessName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "")
      .slice(0, 20) || "support"
  );
}

export function getDefaultHandoff(businessName: string): string {
  const email = `support@${businessSlug(businessName)}.com`;
  return `I couldn't find a definitive answer in our knowledge base, but I'd love to get you the right help. Please email ${email} and our team will take it from there.`;
}

// ──────────────────────────────────────────────────
// System Prompt Builder (used by app/api/chat/route.ts)
// ──────────────────────────────────────────────────

export function buildAgentSystemPrompt(params: {
  baseSystemPrompt: string;
  personalityId: string;
  enabledCategories: string[];
  handoffMessage: string;
}): string {
  const personality = personalityById(params.personalityId) ?? PERSONALITIES[0];

  const scopeText =
    params.enabledCategories.length > 0
      ? `Handle these topics: ${params.enabledCategories.join(", ")}. For any request outside these topics, respond with the handoff.`
      : `Handle general customer support questions for this business.`;

  const handoffText =
    params.handoffMessage?.trim() ||
    "Please contact our support team and they will help you further.";

  const base = params.baseSystemPrompt?.trim() ||
    "You are a helpful customer support agent for this business. Answer accurately using the business context provided, and never invent facts that are not supported.";

  return [
    base,
    `Tone: ${personality.tone}`,
    scopeText,
    `When you cannot answer confidently or the request is out of scope, say: "${handoffText}"`,
  ].join("\n\n");
}
