/**
 * C-Support — Onboarding Analysis Engine
 *
 * Multi-stage analysis for business policy onboarding:
 * 1. Extract categories from policies (no hardcoded whitelist)
 * 2. Structure policies with categories, descriptions, keywords
 * 3. Auto-generate system prompt
 * 4. Validate analysis results
 *
 * Replaces the single-shot LLM call in app/api/onboarding/analyze/route.ts
 */

import { callLLM, type Message } from "@/lib/chat";
import type { OnboardingAnalysis, OnboardingValidation } from "./types";

// ── Stage 1: Extract Categories ───────────────────
// The LLM extracts ALL relevant categories from the policies.
// No filtering against a hardcoded list.

function buildCategoryExtractionPrompt(params: {
  policies: string;
  businessName: string;
  businessNiche: string;
}): Message[] {
  return [
    {
      role: "system",
      content: `You are a business analyst for a customer support system. Your task is to analyze a business's policies and extract all relevant support categories.

You must respond with ONLY valid JSON (no markdown, no code fences, no explanation). The JSON must match this exact schema:

{
  "categories": [
    {
      "name": "CATEGORY NAME",
      "description": "Brief description of what this category covers",
      "keywords": ["keyword1", "keyword2", "keyword3"],
      "priority": "high|medium|low"
    }
  ],
  "summary": "1-2 sentence summary of what the policies cover"
}

Rules:
- Extract EVERY category mentioned in the policies — do not limit yourself to a predefined list
- Use clear, descriptive category names (e.g., "Refund Policy", "Shipping Times", "Warranty Coverage")
- Include keywords that would help match customer questions to this category
- Priority: "high" for core business policies, "medium" for important but less frequent, "low" for edge cases
- Write a concise summary of the overall policy landscape`
    },
    {
      role: "user",
      content: `Analyze these business policies and extract all relevant support categories.

Business Name: ${params.businessName}
Business Niche: ${params.businessNiche}

Policies:
${params.policies}`
    }
  ];
}

// ── Stage 2: Structure Policies ───────────────────
// Organize the raw policy text into structured entries

function buildPolicyStructuringPrompt(params: {
  policies: string;
  categories: Array<{ name: string; description: string; keywords: string[] }>;
  businessName: string;
}): Message[] {
  const categoryList = params.categories
    .map((c) => `- ${c.name}: ${c.description}`)
    .join("\n");

  return [
    {
      role: "system",
      content: `You are a policy analyst for a customer support system. Your task is to organize raw business policies into structured entries that an AI agent can use.

You must respond with ONLY valid JSON (no markdown, no code fences, no explanation). The JSON must match this exact schema:

{
  "policies": [
    {
      "category": "CATEGORY NAME",
      "description": "Clear, actionable description of the policy",
      "keywords": ["keyword1", "keyword2"],
      "priority": "high|medium|low"
    }
  ]
}

Rules:
- Each policy entry should be a distinct, actionable rule
- Map each policy to one of the provided categories
- Use clear language that an AI agent can follow
- Include keywords for matching customer questions
- Preserve all specific details (timeframes, amounts, conditions)`
    },
    {
      role: "user",
      content: `Organize these business policies into structured entries.

Business Name: ${params.businessName}

Available Categories:
${categoryList}

Raw Policies:
${params.policies}`
    }
  ];
}

// ── Stage 3: Generate System Prompt ───────────────

function buildSystemPromptGeneration(params: {
  businessName: string;
  businessNiche: string;
  businessOrigin: string;
  categories: Array<{ name: string; description: string }>;
  policies: Array<{ category: string; description: string }>;
}): Message[] {
  const categorySummary = params.categories
    .map((c) => `- ${c.name}: ${c.description}`)
    .join("\n");

  const policySummary = params.policies
    .map((p) => `- [${p.category}] ${p.description}`)
    .join("\n");

  return [
    {
      role: "system",
      content: `You are a prompt engineer for a customer support AI. Your task is to create an effective system prompt for a customer support agent.

You must respond with ONLY valid JSON (no markdown, no code fences, no explanation). The JSON must match this exact schema:

{
  "systemPrompt": "The complete system prompt for the AI agent"
}

The system prompt should:
1. Define the agent's role and personality
2. List the specific areas the agent can help with (from the categories)
3. Include key policies the agent must follow
4. Set boundaries — what the agent should NOT do
5. Specify how to handle out-of-scope questions
6. Be concise but comprehensive (200-400 words)`
    },
    {
      role: "user",
      content: `Create a system prompt for a customer support agent.

Business Name: ${params.businessName}
Business Niche: ${params.businessNiche}
Business Origin: ${params.businessOrigin}

Categories the agent can handle:
${categorySummary}

Key policies:
${policySummary}`
    }
  ];
}

// ── Stage 4: Validate Analysis ────────────────────

function validateAnalysis(analysis: {
  matchedCategories: Array<{ name: string; description: string; keywords: string[] }>;
  suggestedPolicies: Array<{ category: string; description: string; keywords: string[]; priority: string }>;
  systemPrompt: string;
  summary: string;
}): OnboardingValidation {
  const issues: string[] = [];
  let isConsistent = true;
  let categoriesMatchPolicies = true;
  let systemPromptAccurate = true;

  // Check 1: Categories are not empty
  if (analysis.matchedCategories.length === 0) {
    issues.push("No categories were detected from the policies");
    isConsistent = false;
  }

  // Check 2: Each category has a description
  for (const cat of analysis.matchedCategories) {
    if (!cat.description || cat.description.trim().length < 10) {
      issues.push(`Category "${cat.name}" has an insufficient description`);
      isConsistent = false;
    }
  }

  // Check 3: Policies map to existing categories
  const categoryNames = new Set(analysis.matchedCategories.map((c) => c.name));
  for (const policy of analysis.suggestedPolicies) {
    if (!categoryNames.has(policy.category)) {
      issues.push(`Policy maps to non-existent category: "${policy.category}"`);
      categoriesMatchPolicies = false;
    }
  }

  // Check 4: System prompt is not empty and mentions the business
  if (!analysis.systemPrompt || analysis.systemPrompt.trim().length < 50) {
    issues.push("System prompt is too short or empty");
    systemPromptAccurate = false;
  }

  // Check 5: Summary is not empty
  if (!analysis.summary || analysis.summary.trim().length < 10) {
    issues.push("Summary is too short or empty");
    isConsistent = false;
  }

  // Check 6: No duplicate categories
  const seenCategories = new Set<string>();
  for (const cat of analysis.matchedCategories) {
    if (seenCategories.has(cat.name)) {
      issues.push(`Duplicate category: "${cat.name}"`);
      isConsistent = false;
    }
    seenCategories.add(cat.name);
  }

  return {
    isConsistent,
    categoriesMatchPolicies,
    systemPromptAccurate,
    issues,
  };
}

// ── Parse LLM JSON Response ──────────────────────

function parseLLMJson<T>(raw: string): T | null {
  try {
    // Try direct parse first
    return JSON.parse(raw) as T;
  } catch {
    // Try to extract JSON from markdown code fences
    const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1]) as T;
      } catch {
        return null;
      }
    }

    // Try to find JSON object in the text
    const braceMatch = raw.match(/\{[\s\S]*\}/);
    if (braceMatch) {
      try {
        return JSON.parse(braceMatch[0]) as T;
      } catch {
        return null;
      }
    }

    return null;
  }
}

// ── Main Analysis Function ────────────────────────

export async function analyzePolicies(params: {
  policies: string;
  businessName: string;
  businessNiche: string;
  businessOrigin: string;
}): Promise<OnboardingAnalysis> {
  const { policies, businessName, businessNiche, businessOrigin } = params;

  // Stage 1: Extract categories
  const categoryPrompt = buildCategoryExtractionPrompt({ policies, businessName, businessNiche });
  const categoryResponse = await callLLM(categoryPrompt);

  interface CategoryExtraction {
    categories: Array<{ name: string; description: string; keywords: string[]; priority: string }>;
    summary: string;
  }

  const categoryData = parseLLMJson<CategoryExtraction>(categoryResponse);

  if (!categoryData || !categoryData.categories) {
    // Fallback: create a single generic category
    return {
      matchedCategories: ["General Support"],
      suggestedPolicies: [{
        category: "General Support",
        description: "General customer support inquiries",
        keywords: ["help", "support", "question"],
        priority: "medium",
      }],
      systemPrompt: `You are a customer support agent for ${businessName}. Answer customer questions accurately and politely.`,
      summary: "General customer support policies",
      validation: {
        isConsistent: false,
        categoriesMatchPolicies: false,
        systemPromptAccurate: false,
        issues: ["Failed to parse category extraction — using fallback"],
      },
    };
  }

  // Stage 2: Structure policies
  const policyPrompt = buildPolicyStructuringPrompt({
    policies,
    categories: categoryData.categories,
    businessName,
  });
  const policyResponse = await callLLM(policyPrompt);

  interface PolicyStructuring {
    policies: Array<{ category: string; description: string; keywords: string[]; priority: string }>;
  }

  const policyData = parseLLMJson<PolicyStructuring>(policyResponse);

  if (!policyData || !policyData.policies) {
    // Fallback: create policies from categories
    const fallbackPolicies = categoryData.categories.map((cat) => ({
      category: cat.name,
      description: cat.description,
      keywords: cat.keywords,
      priority: cat.priority as "high" | "medium" | "low",
    }));

    return {
      matchedCategories: categoryData.categories.map((c) => c.name),
      suggestedPolicies: fallbackPolicies,
      systemPrompt: "",
      summary: categoryData.summary || "Policies analyzed successfully",
      validation: {
        isConsistent: true,
        categoriesMatchPolicies: true,
        systemPromptAccurate: false,
        issues: ["Failed to parse policy structuring — using category descriptions"],
      },
    };
  }

  // Stage 3: Generate system prompt
  const promptGenInput = buildSystemPromptGeneration({
    businessName,
    businessNiche,
    businessOrigin,
    categories: categoryData.categories,
    policies: policyData.policies,
  });
  const promptGenResponse = await callLLM(promptGenInput);

  interface PromptGeneration {
    systemPrompt: string;
  }

  const promptData = parseLLMJson<PromptGeneration>(promptGenResponse);

  // Stage 4: Validate
  const validation = validateAnalysis({
    matchedCategories: categoryData.categories,
    suggestedPolicies: policyData.policies,
    systemPrompt: promptData?.systemPrompt || "",
    summary: categoryData.summary || "",
  });

  return {
    matchedCategories: categoryData.categories.map((c) => c.name),
    suggestedPolicies: policyData.policies.map((p) => ({
      category: p.category,
      description: p.description,
      keywords: p.keywords,
      priority: p.priority as "high" | "medium" | "low",
    })),
    systemPrompt: promptData?.systemPrompt || "",
    summary: categoryData.summary || "",
    validation,
  };
}
