import { NextRequest } from "next/server";
import { callLLM, buildAnalysisPrompt, type Message } from "@/lib/chat";

/**
 * Training dataset categories — must match policy/dataset_metadata.json exactly.
 * These are the 33 categories the AI uses to classify business policies.
 */
const TRAINING_CATEGORIES = [
  "PAYMENT",
  "TECHNICAL SUPPORT",
  "ACCOUNT",
  "DELIVERY",
  "SHIPPING",
  "RETURNS",
  "REFUND",
  "ORDER",
  "PRODUCT",
  "BILLING",
  "INVOICE",
  "WARRANTY",
  "COMPLAINT",
  "FEEDBACK",
  "CANCELLATION",
  "SUBSCRIPTION",
  "PRIVACY",
  "SECURITY",
  "FRAUD",
  "LEGAL",
  "GENERIC",
  "HUMAN AGENT",
  "APPOINTMENT",
  "PROMOTION",
  "DISCOUNT",
  "LOYALTY",
  "INSURANCE",
  "CLAIMS",
  "COMPLIANCE",
  "DATA REQUEST",
  "ACCOUNT CLOSURE",
  "SERVICE DOWNTIME",
  "CUSTOMER SATISFACTION",
];

interface AnalyzeRequest {
  policies: string;
  businessName: string;
  businessNiche: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: AnalyzeRequest = await request.json();
    const { policies, businessName, businessNiche } = body;

    // ─── Validation ─────────────────────────────────
    if (!policies || typeof policies !== "string" || policies.trim().length < 20) {
      return Response.json(
        { error: "Please provide at least 20 characters of policy content." },
        { status: 400 }
      );
    }

    if (!businessName || typeof businessName !== "string") {
      return Response.json(
        { error: "Business name is required." },
        { status: 400 }
      );
    }

    if (!businessNiche || typeof businessNiche !== "string") {
      return Response.json(
        { error: "Business niche is required." },
        { status: 400 }
      );
    }

    // ─── Build prompt ───────────────────────────────
    const messages: Message[] = buildAnalysisPrompt({
      policies: policies.trim(),
      businessName: businessName.trim(),
      businessNiche: businessNiche.trim(),
      categories: TRAINING_CATEGORIES,
    });

    // ─── Call LLM ───────────────────────────────────
    const rawResponse = await callLLM(messages);

    // ─── Parse JSON response ────────────────────────
    let parsed: Record<string, unknown>;

    try {
      // Strip markdown code fences if present
      let cleaned = rawResponse.trim();
      if (cleaned.startsWith("```")) {
        cleaned = cleaned.replace(/^```(?:json)?\s*\n?/, "").replace(/\n?```\s*$/, "");
      }
      parsed = JSON.parse(cleaned);
    } catch {
      return Response.json(
        {
          error: "AI returned an invalid response. Please try again.",
          matchedCategories: [],
          systemPrompt: "",
          summary: "Failed to parse AI response.",
          suggestedPolicies: [],
        },
        { status: 500 }
      );
    }

    // ─── Normalize & validate ───────────────────────
    const matchedCategories = Array.isArray(parsed.matchedCategories)
      ? (parsed.matchedCategories as string[]).filter((c) =>
          TRAINING_CATEGORIES.includes(c)
        )
      : [];

    const suggestedPolicies = Array.isArray(parsed.suggestedPolicies)
      ? (parsed.suggestedPolicies as { category: string; description: string }[])
          .filter(
            (p) =>
              p &&
              typeof p.category === "string" &&
              typeof p.description === "string"
          )
          .slice(0, 20) // Cap at 20 policies
      : [];

    return Response.json({
      matchedCategories,
      systemPrompt: typeof parsed.systemPrompt === "string" ? parsed.systemPrompt : "",
      summary: typeof parsed.summary === "string" ? parsed.summary : "",
      suggestedPolicies,
    });
  } catch (err) {
    return Response.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "An unexpected error occurred during analysis.",
      },
      { status: 500 }
    );
  }
}
