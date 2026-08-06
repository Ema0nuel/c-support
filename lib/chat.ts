/**
 * C-Support — Chat Module (Stateless)
 *
 * Provides LLM API call via OpenCode-Zen (OpenAI-compatible endpoint).
 * No database dependencies — all context is passed in as parameters.
 *
 * Follows fitmate's lib/chat.ts pattern exactly.
 */

// ──────────────────────────────────────────────────
// Configuration — OpenCode-Zen API
// ──────────────────────────────────────────────────

const API_BASE_URL = process.env.LLM_API_BASE_URL || "https://opencode.ai/zen/v1";
const API_KEY = process.env.LLM_API_KEY || "";
export const DISPLAY_MODEL = process.env.LLM_DISPLAY_MODEL || "deepseek-customer-support";
const ACTUAL_MODEL = process.env.LLM_MODEL || "deepseek-v4-flash-free";

const MAX_RETRIES = 2;
const REQUEST_TIMEOUT = 30_000;

// ──────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────

export interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

// ──────────────────────────────────────────────────
// Prompt Engineering Layer
// ──────────────────────────────────────────────────

export function buildAnalysisPrompt(params: {
  policies: string;
  businessName: string;
  businessNiche: string;
  categories: string[];
}): Message[] {
  const { policies, businessName, businessNiche, categories } = params;

  // Build the category instruction based on whether categories are provided
  const categoryInstruction = categories.length > 0
    ? `Available categories from the training dataset:\n${categories.join(", ")}\n\nRules:\n- matchedCategories: Select ONLY categories that directly relate to the provided policies. Use the exact category names from the list above.`
    : `Rules:\n- matchedCategories: Detect ALL relevant categories from the policies. Use clear, descriptive names (e.g., "Refund Policy", "Shipping Times", "Warranty Coverage"). Do NOT limit yourself to any predefined list — extract every category the business covers.`;

  const systemPrompt = `You are a knowledge base analyst for a customer support system. Your task is to analyze a business's policies and create a structured knowledge base profile.

You must respond with ONLY valid JSON (no markdown, no code fences, no explanation). The JSON must match this exact schema:

{
  "matchedCategories": ["CATEGORY1", "CATEGORY2"],
  "systemPrompt": "You are a customer support agent for [BusinessName]...",
  "summary": "Your business has policies covering...",
  "suggestedPolicies": [
    { "category": "CATEGORY", "description": "Brief description of the policy" }
  ]
}

${categoryInstruction}

- systemPrompt: Write a concise system prompt (2-3 sentences) that instructs an AI agent how to behave as a customer support agent for this specific business. Include the business name and niche.
- summary: Write a 1-2 sentence summary of what the policies cover.
- suggestedPolicies: Extract each distinct policy as a category + description pair. One entry per policy topic.`;

  const userMessage = `Analyze these business policies and create a knowledge base profile.

Business Name: ${businessName}
Business Niche: ${businessNiche}

Policies:
${policies}`;

  return [
    { role: "system", content: systemPrompt },
    { role: "user", content: userMessage },
  ];
}

// ──────────────────────────────────────────────────
// LLM API call — OpenCode-Zen (OpenAI-compatible)
// ──────────────────────────────────────────────────

export async function callLLM(messages: Message[]): Promise<string> {
  if (!API_KEY) {
    throw new Error(
      "AI service is not configured. Please set the LLM_API_KEY environment variable in your .env file and restart the dev server."
    );
  }

  const payload = {
    model: ACTUAL_MODEL,
    messages,
    max_tokens: 1024,
    temperature: 0.7,
    top_p: 0.9,
  };

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

      const response = await fetch(`${API_BASE_URL}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (attempt < MAX_RETRIES - 1) continue;
        throw new Error(`API returned HTTP ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (err) {
      if (attempt < MAX_RETRIES - 1) continue;

      if (err instanceof DOMException && err.name === "AbortError") {
        throw new Error("AI service timed out. Please try again.");
      }

      throw new Error("Failed to connect to AI service. Please try again.");
    }
  }

  throw new Error("Unable to generate response. Please try again.");
}
