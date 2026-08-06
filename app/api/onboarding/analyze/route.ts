import { NextRequest } from "next/server";
import { callLLM, buildAnalysisPrompt, type Message } from "@/lib/chat";

/**
 * C-Support — Onboarding Policy Analysis
 *
 * Analyzes business policies and extracts:
 * - Categories (auto-detected, NO hardcoded whitelist)
 * - Structured policy entries
 * - Auto-generated system prompt
 * - Summary
 *
 * The LLM detects ALL relevant categories from the policies.
 * Categories are stored as-is — no filtering against a predefined list.
 */

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
    // The prompt now asks the LLM to detect ALL relevant categories
    // without constraining to a predefined list.
    const messages: Message[] = buildAnalysisPrompt({
      policies: policies.trim(),
      businessName: businessName.trim(),
      businessNiche: businessNiche.trim(),
      categories: [], // Empty — no hardcoded whitelist
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
    // Accept ALL categories returned by the LLM — no hardcoded filtering
    const matchedCategories = Array.isArray(parsed.matchedCategories)
      ? (parsed.matchedCategories as string[])
          .filter((c) => typeof c === "string" && c.trim().length > 0)
          .slice(0, 30) // Cap at 30 categories
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

    // ─── Sanity check — catch silent LLM failures ──
    // If the LLM returned all-empty data, it's not a valid analysis
    const summary = typeof parsed.summary === "string" ? parsed.summary : "";
    if (matchedCategories.length === 0 && suggestedPolicies.length === 0 && !summary.trim()) {
      return Response.json(
        {
          error: "The AI could not analyze your policies. Please try again or rephrase your input.",
          matchedCategories: [],
          systemPrompt: "",
          summary: "",
          suggestedPolicies: [],
        },
        { status: 422 }
      );
    }

    return Response.json({
      matchedCategories,
      systemPrompt: typeof parsed.systemPrompt === "string" ? parsed.systemPrompt : "",
      summary,
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
