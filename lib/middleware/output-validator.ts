/**
 * C-Support — Output Validator (Stage 5)
 *
 * Validates the generated response using sub-agent style checks:
 * - Hallucination detection
 * - Policy adherence
 * - Topic continuity
 * - Tone appropriateness
 *
 * Each check is an independent "sub-agent" that produces its own score.
 * They run in parallel (conceptually) and produce independent scores.
 */

import type {
  TopicContext,
  ScopeCheckResult,
  AssembledContext,
  ResponseQuality,
  ValidationResult,
  ValidationIssue,
  BusinessContext,
} from "./types";

// ── Sub-Agent: Hallucination Detection ────────────
// Checks for signs that the response made up information

function checkHallucination(
  response: string,
  businessContext: BusinessContext
): { score: number; issues: ValidationIssue[] } {
  const issues: ValidationIssue[] = [];
  let riskScore = 0;

  // Check for fabricated URLs
  const urlPattern = /https?:\/\/[^\s]+/gi;
  const urls = response.match(urlPattern) || [];
  const businessName = businessContext.businessName.toLowerCase();
  for (const url of urls) {
    if (!url.includes(businessName.replace(/\s+/g, "")) && !url.includes("example")) {
      // URL doesn't seem related to the business
      riskScore += 0.1;
      issues.push({
        type: "hallucination",
        severity: "medium",
        description: `Response contains a URL that may not belong to the business: ${url}`,
        suggestion: "Remove or verify the URL before sending",
      });
    }
  }

  // Check for fabricated phone numbers
  const phonePattern = /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g;
  const phones = response.match(phonePattern) || [];
  if (phones.length > 0 && !businessContext.policiesInput.match(/\d{3}[-.]?\d{3}[-.]?\d{4}/)) {
    riskScore += 0.2;
    issues.push({
      type: "hallucination",
      severity: "high",
      description: "Response contains a phone number not found in business policies",
      suggestion: "Remove the phone number or use one from the business policies",
    });
  }

  // Check for specific time promises not in policies
  const timePromises = response.match(/\b(?:within|in|takes?)\s+\d+\s+(?:business\s+)?(?:days?|hours?|minutes?)/gi) || [];
  for (const promise of timePromises) {
    if (!businessContext.policiesInput.toLowerCase().includes(promise.toLowerCase().split(" ").slice(-2).join(" "))) {
      riskScore += 0.1;
      issues.push({
        type: "hallucination",
        severity: "medium",
        description: `Response makes a time promise that may not be in policies: "${promise}"`,
        suggestion: "Verify this timeline against business policies",
      });
    }
  }

  // Check for "I can confirm" / "I've checked" without actual data
  const confirmationPhrases = [
    "i can confirm", "i've checked", "i've verified", "i've looked into",
    "your order has been", "your refund has been", "your account has been",
  ];
  for (const phrase of confirmationPhrases) {
    if (response.toLowerCase().includes(phrase)) {
      riskScore += 0.05;
      issues.push({
        type: "hallucination",
        severity: "low",
        description: `Response claims to have verified something: "${phrase}"`,
        suggestion: "Ensure this is accurate or soften the claim",
      });
    }
  }

  return {
    score: Math.max(0, 1 - riskScore),
    issues,
  };
}

// ── Sub-Agent: Policy Adherence ───────────────────
// Checks that the response aligns with business policies

function checkPolicyAdherence(
  response: string,
  context: AssembledContext
): { score: number; issues: ValidationIssue[] } {
  const issues: ValidationIssue[] = [];
  let adherenceScore = 1.0;

  // If policies were provided, check that the response addresses the topic
  // (not that it quotes policy keywords — that would encourage verbatim copying)
  if (context.relevantPolicies.length > 0 && response.length > 30) {
    // Extract the main topic from each policy (first few words / category label)
    const policyTopics = context.relevantPolicies.map((p) => {
      const colonIdx = p.indexOf(":");
      return colonIdx > 0 ? p.slice(0, colonIdx).trim().toLowerCase() : "";
    }).filter(Boolean);

    // Check if at least one policy topic is addressed (by concept, not exact words)
    if (policyTopics.length > 0) {
      const responseLower = response.toLowerCase();
      const topicAddressed = policyTopics.some((topic) => {
        // Check topic words appear (allowing partial matches for flexibility)
        const words = topic.split(/\s+/).filter((w) => w.length > 3);
        return words.some((w) => responseLower.includes(w));
      });

      if (!topicAddressed) {
        adherenceScore -= 0.2;
        issues.push({
          type: "policy_violation",
          severity: "low",
          description: "Response may not address the relevant policy topics",
          suggestion: "Ensure the response covers the policy areas the customer asked about",
        });
      }
    }
  }

  // Check for contradicting statements
  const contradictionPairs = [
    ["free", "charge"],
    ["no fee", "fee applies"],
    ["always", "never"],
    ["guaranteed", "no guarantee"],
  ];

  for (const [positive, negative] of contradictionPairs) {
    if (response.toLowerCase().includes(positive) && response.toLowerCase().includes(negative)) {
      adherenceScore -= 0.1;
      issues.push({
        type: "policy_violation",
        severity: "low",
        description: `Response may contain contradictory statements: "${positive}" and "${negative}"`,
        suggestion: "Review for consistency",
      });
    }
  }

  return {
    score: Math.max(0, adherenceScore),
    issues,
  };
}

// ── Sub-Agent: Topic Continuity ───────────────────
// Checks that the response addresses the actual topic

function checkTopicContinuity(
  response: string,
  topic: TopicContext,
  context: AssembledContext
): { score: number; issues: ValidationIssue[] } {
  const issues: ValidationIssue[] = [];
  let continuityScore = 1.0;

  // Check that the response addresses the user's question
  const userKeywords = topic.keywords.filter((k) => k.length > 3);
  const responseLower = response.toLowerCase();

  if (userKeywords.length > 0) {
    const addressedKeywords = userKeywords.filter((kw) => responseLower.includes(kw));
    const coverage = addressedKeywords.length / userKeywords.length;

    if (coverage < 0.2 && userKeywords.length >= 2) {
      continuityScore -= 0.3;
      issues.push({
        type: "off_topic",
        severity: "medium",
        description: "Response may not address the customer's specific question",
        suggestion: `Address these topics: ${userKeywords.join(", ")}`,
      });
    }
  }

  // Check for abrupt topic changes
  const topicSwitchPhrases = [
    "by the way", "speaking of", "moving on", "let's talk about",
    "unrelated", "different topic",
  ];
  for (const phrase of topicSwitchPhrases) {
    if (responseLower.includes(phrase)) {
      continuityScore -= 0.2;
      issues.push({
        type: "off_topic",
        severity: "medium",
        description: `Response contains a topic switch: "${phrase}"`,
        suggestion: "Stay on the current topic unless the customer switches",
      });
    }
  }

  // Check if the response is too short (likely incomplete)
  if (response.length < 50 && topic.classifiedIntent.intent !== "acknowledgment") {
    continuityScore -= 0.2;
    issues.push({
      type: "incomplete",
      severity: "medium",
      description: "Response is very short and may be incomplete",
      suggestion: "Provide a more complete response",
    });
  }

  return {
    score: Math.max(0, continuityScore),
    issues,
  };
}

// ── Sub-Agent: Policy Leak Detection ──────────────
// Checks that the response does NOT contain verbatim policy text.
// Policies are internal reference — customers should see natural summaries.

function checkPolicyLeak(
  response: string,
  businessContext: BusinessContext
): { score: number; issues: ValidationIssue[] } {
  const issues: ValidationIssue[] = [];
  let leakScore = 0;

  if (!businessContext.policiesInput) return { score: 1, issues };

  const responseLower = response.toLowerCase();
  const policyText = businessContext.policiesInput;

  // Split policies into individual lines/entries
  const policyLines = policyText
    .split(/\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 20);

  // Check for verbatim policy passages (5+ consecutive words matching)
  for (const line of policyLines) {
    const words = line.toLowerCase().split(/\s+/).filter((w) => w.length > 3);

    // Check for 5-word subsequences that appear in both policy and response
    for (let i = 0; i <= words.length - 5; i++) {
      const phrase = words.slice(i, i + 5).join(" ");
      if (responseLower.includes(phrase)) {
        leakScore += 0.15;
        issues.push({
          type: "policy_leak",
          severity: "high",
          description: `Response appears to quote policy text verbatim: "${phrase.slice(0, 50)}..."`,
          suggestion: "Rephrase in natural language — policies are internal reference only",
        });
        break; // One flag per policy line is enough
      }
    }
  }

  // Also check for long quoted segments (phrases in quotes or bold from policies)
  const quotedPatterns = response.match(/[""`]([^"`]+)[""`]/g) || [];
  for (const quoted of quotedPatterns) {
    const inner = quoted.slice(1, -1).toLowerCase();
    if (inner.length > 30 && policyText.toLowerCase().includes(inner.slice(0, 30))) {
      leakScore += 0.2;
      issues.push({
        type: "policy_leak",
        severity: "medium",
        description: `Response contains a quoted passage that matches policy text`,
        suggestion: "Remove quotes and paraphrase the policy intent instead",
      });
    }
  }

  return {
    score: Math.max(0, 1 - leakScore),
    issues,
  };
}

// ── Sub-Agent: Tone Check ─────────────────────────
// Checks that the tone matches the customer's sentiment

function checkTone(
  response: string,
  topic: TopicContext
): { score: number; issues: ValidationIssue[] } {
  const issues: ValidationIssue[] = [];
  let toneScore = 1.0;

  const sentiment = topic.classifiedIntent.sentiment;
  const responseLower = response.toLowerCase();

  // If customer is angry/frustrated, response should acknowledge it
  if (sentiment === "angry" || sentiment === "frustrated") {
    const empathyMarkers = [
      "understand", "sorry", "apologize", "frustrating", "difficult",
      "concern", "issue", "problem",
    ];
    const hasEmpathy = empathyMarkers.some((marker) => responseLower.includes(marker));

    if (!hasEmpathy) {
      toneScore -= 0.3;
      issues.push({
        type: "tone_mismatch",
        severity: "medium",
        description: "Customer is frustrated but response lacks empathy markers",
        suggestion: "Acknowledge the customer's frustration before providing a solution",
      });
    }
  }

  // If customer is confused, response should be clear and structured
  if (sentiment === "confused") {
    const clarityMarkers = [
      "let me", "here's how", "step", "first", "try",
      "here's what", "let me explain",
    ];
    const hasClarity = clarityMarkers.some((marker) => responseLower.includes(marker));

    if (!hasClarity) {
      toneScore -= 0.2;
      issues.push({
        type: "tone_mismatch",
        severity: "low",
        description: "Customer seems confused but response lacks clear structure",
        suggestion: "Provide step-by-step guidance or clear explanations",
      });
    }
  }

  // Check for inappropriate tone (too casual for serious issues)
  if (sentiment === "angry") {
    const tooCasual = ["haha", "lol", "😊", "😄", "no worries", "chill"];
    for (const casual of tooCasual) {
      if (responseLower.includes(casual)) {
        toneScore -= 0.3;
        issues.push({
          type: "tone_mismatch",
          severity: "high",
          description: `Response is too casual for an angry customer: "${casual}"`,
          suggestion: "Use a more serious and empathetic tone",
        });
      }
    }
  }

  return {
    score: Math.max(0, toneScore),
    issues,
  };
}

// ── Main Validator ────────────────────────────────

export function validateResponse(
  response: string,
  context: AssembledContext,
  topic: TopicContext,
  businessContext: BusinessContext,
  scopeCheck: ScopeCheckResult
): ValidationResult {
  // Run all sub-agent checks
  const hallucinationCheck = checkHallucination(response, businessContext);
  const policyCheck = checkPolicyAdherence(response, context);
  const policyLeakCheck = checkPolicyLeak(response, businessContext);
  const continuityCheck = checkTopicContinuity(response, topic, context);
  const toneCheck = checkTone(response, topic);

  // Aggregate quality scores
  const quality: ResponseQuality = {
    policyAdherence: policyCheck.score,
    hallucinationRisk: 1 - hallucinationCheck.score, // Invert: higher = riskier
    topicContinuity: continuityCheck.score,
    toneScore: toneCheck.score,
    overall: 0,
  };

  // Weighted overall score — policy leak is critical (weighted heavily)
  quality.overall = (
    quality.policyAdherence * 0.2 +
    (1 - quality.hallucinationRisk) * 0.2 +
    policyLeakCheck.score * 0.3 +   // Policy leaking is a security issue — high weight
    quality.topicContinuity * 0.15 +
    quality.toneScore * 0.15
  );

  // Collect all issues
  const allIssues = [
    ...hallucinationCheck.issues,
    ...policyCheck.issues,
    ...policyLeakCheck.issues,
    ...continuityCheck.issues,
    ...toneCheck.issues,
  ];

  // Determine if rewrite is needed
  const hasHighSeverityIssues = allIssues.some((i) => i.severity === "high");
  const overallScoreBelowThreshold = quality.overall < 0.5;

  return {
    passed: !hasHighSeverityIssues && quality.overall >= 0.5,
    quality,
    needsRewrite: hasHighSeverityIssues || overallScoreBelowThreshold,
    issues: allIssues,
  };
}

// ── Response Rewriter ─────────────────────────────
// If validation fails, attempt to fix the response

export function rewriteResponse(
  response: string,
  validation: ValidationResult,
  context: AssembledContext
): string {
  let rewritten = response;

  // ── Policy leak: strip verbatim policy passages ──
  const hasPolicyLeak = validation.issues.some((i) => i.type === "policy_leak");
  if (hasPolicyLeak && context.relevantPolicies.length > 0) {
    // Remove quoted sections that match policy text
    for (const policy of context.relevantPolicies) {
      const policyWords = policy.toLowerCase().split(/\s+/).filter((w) => w.length > 4);
      for (let i = 0; i <= policyWords.length - 5; i++) {
        const phrase = policyWords.slice(i, i + 5).join(" ");
        const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const regex = new RegExp(`[""\`]?${escaped}[""\`]?`, "gi");
        rewritten = rewritten.replace(regex, "").trim();
      }
    }
    // Clean up orphaned bullet points left behind
    rewritten = rewritten
      .replace(/^\s*[-•*]\s*$/gm, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  // ── Hallucination: remove fabricated data ──
  for (const issue of validation.issues) {
    if (issue.type === "hallucination" && issue.severity === "high") {
      rewritten = rewritten.replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, "[contact information]");
    }
  }

  // If response is too short after rewriting, add a follow-up prompt
  if (rewritten.length < 50) {
    const topic = context.topicNarrative.includes("out of scope")
      ? "this matter"
      : "your issue";
    rewritten += `\n\nIs there anything specific about ${topic} you'd like me to clarify?`;
  }

  // Clean up
  rewritten = rewritten.replace(/\n{3,}/g, "\n\n").trim();

  return rewritten;
}
