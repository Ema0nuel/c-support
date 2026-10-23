import "server-only";

/**
 * C-Support — Chat Module (Stateless)
 *
 * Provides LLM API calls through OpenRouter's OpenAI-compatible endpoint.
 * No database dependencies — all context is passed in as parameters.
 *
 * Follows fitmate's lib/chat.ts pattern exactly.
 */

// ──────────────────────────────────────────────────
// Configuration — OpenRouter API
// ──────────────────────────────────────────────────

const API_BASE_URL = process.env.LLM_API_BASE_URL || "https://openrouter.ai/api/v1";
const API_KEY = process.env.OPENROUTER_API_KEY || process.env.LLM_API_KEY || "";
const ACTUAL_MODEL = process.env.LLM_MODEL || "openrouter/free";

const MAX_RETRIES = 2;
const REQUEST_TIMEOUT = 30_000;

export interface LLMCompletion {
  content: string;
  model: string;
}

export class LLMServiceError extends Error {
  constructor(
    message: string,
    public readonly status: 502 | 503 | 504,
  ) {
    super(message);
    this.name = "LLMServiceError";
  }
}

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
// LLM API call — OpenRouter (OpenAI-compatible)
// ──────────────────────────────────────────────────

export async function callLLMWithMetadata(messages: Message[]): Promise<LLMCompletion> {
  if (!API_KEY) {
    throw new LLMServiceError("OpenRouter API key is missing.", 503);
  }

  const payload = {
    model: ACTUAL_MODEL,
    messages,
    max_tokens: 1024,
    temperature: 0.7,
    top_p: 0.9,
  };

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

    try {
      const response = await fetch(`${API_BASE_URL}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": process.env.OPENROUTER_HTTP_REFERER || "http://localhost:3001",
          "X-Title": process.env.OPENROUTER_X_TITLE || "C-Support",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!response.ok) {
        const isTransient = response.status === 429 || response.status >= 500;
        if (isTransient && attempt < MAX_RETRIES - 1) continue;
        throw new LLMServiceError(
          `OpenRouter request failed with HTTP ${response.status}.`,
          502,
        );
      }

      let data: {
        model?: unknown;
        choices?: Array<{ message?: { content?: unknown } }>;
      };
      try {
        data = await response.json();
      } catch {
        throw new LLMServiceError("OpenRouter returned invalid JSON.", 502);
      }

      const content = data.choices?.[0]?.message?.content;
      if (typeof content !== "string" || content.trim().length === 0) {
        throw new LLMServiceError("OpenRouter returned an empty response.", 502);
      }

      return {
        content,
        model: typeof data.model === "string" && data.model.trim()
          ? data.model
          : ACTUAL_MODEL,
      };
    } catch (err) {
      if (err instanceof LLMServiceError) throw err;

      const isTimeout = err instanceof Error && err.name === "AbortError";
      if (attempt < MAX_RETRIES - 1) continue;

      throw new LLMServiceError(
        isTimeout
          ? "OpenRouter request timed out."
          : "OpenRouter request failed.",
        isTimeout ? 504 : 502,
      );
    } finally {
      clearTimeout(timeoutId);
    }
  }

  throw new LLMServiceError("OpenRouter request failed.", 502);
}

export async function callLLM(messages: Message[]): Promise<string> {
  const completion = await callLLMWithMetadata(messages);
  return completion.content;
}
