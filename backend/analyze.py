"""
C-Support — Policy Analysis Module.

Mirrors app/api/onboarding/analyze/route.ts exactly:
  - Validates policy content (≥ 20 chars)
  - Builds the analysis prompt
  - Calls the LLM (OpenCode-Zen)
  - Parses the JSON response
  - Filters matched categories against the training dataset
  - Caps suggested policies at 20

The business owner pastes their policies during onboarding; this
module produces the knowledge base profile (matched categories,
system prompt, summary, suggested policies) that seeds the chat
system prompt and the kb_documents table.
"""

from __future__ import annotations

import json
import os
import re

import httpx

# ──────────────────────────────────────────────────
# Configuration — same as lib/chat.ts
# ──────────────────────────────────────────────────

API_BASE_URL = os.getenv("LLM_API_BASE_URL", "https://opencode.ai/zen/v1")
API_KEY = os.getenv("LLM_API_KEY", "")
ACTUAL_MODEL = os.getenv("LLM_MODEL", "deepseek-v4-flash-free")

MAX_RETRIES = 2
REQUEST_TIMEOUT = 30.0

# Training dataset categories — must match policy/dataset_metadata.json
# and app/api/onboarding/analyze/route.ts exactly. These are the 33
# categories the AI uses to classify business policies.
TRAINING_CATEGORIES = [
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
]


# ──────────────────────────────────────────────────
# Prompt Engineering — mirrors buildAnalysisPrompt
# ──────────────────────────────────────────────────

def build_analysis_prompt(
    policies: str,
    business_name: str,
    business_niche: str,
) -> list[dict]:
    """Build the message array for policy analysis (mirrors lib/chat.ts)."""
    categories = ", ".join(TRAINING_CATEGORIES)

    system_prompt = (
        "You are a knowledge base analyst for a customer support system. "
        "Your task is to analyze a business's policies and create a structured "
        "knowledge base profile.\n\n"
        "You must respond with ONLY valid JSON (no markdown, no code fences, no "
        "explanation). The JSON must match this exact schema:\n\n"
        "{\n"
        '  "matchedCategories": ["CATEGORY1", "CATEGORY2"],\n'
        '  "systemPrompt": "You are a customer support agent for [BusinessName]...",\n'
        '  "summary": "Your business has policies covering...",\n'
        '  "suggestedPolicies": [\n'
        '    { "category": "CATEGORY", "description": "Brief description of the policy" }\n'
        "  ]\n"
        "}\n\n"
        "Available categories from the training dataset:\n"
        f"{categories}\n\n"
        "Rules:\n"
        "- matchedCategories: Select ONLY categories that directly relate to the "
        "provided policies. Use the exact category names from the list above.\n"
        "- systemPrompt: Write a concise system prompt (2-3 sentences) that "
        "instructs an AI agent how to behave as a customer support agent for this "
        "specific business. Include the business name and niche.\n"
        "- summary: Write a 1-2 sentence summary of what the policies cover.\n"
        "- suggestedPolicies: Extract each distinct policy as a category + "
        "description pair. One entry per policy topic."
    )

    user_message = (
        "Analyze these business policies and create a knowledge base profile.\n\n"
        f"Business Name: {business_name}\n"
        f"Business Niche: {business_niche}\n\n"
        f"Policies:\n{policies}"
    )

    return [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_message},
    ]


# ──────────────────────────────────────────────────
# LLM call — OpenCode-Zen (OpenAI-compatible)
# ──────────────────────────────────────────────────

async def _call_llm(messages: list[dict]) -> str:
    """Call the LLM and return raw response text. Raises on failure."""
    if not API_KEY:
        # Mirrors lib/chat.ts: return an empty-but-parseable profile
        return json.dumps({
            "matchedCategories": [],
            "systemPrompt": "",
            "summary": "AI model not configured. Please set the LLM_API_KEY environment variable.",
            "suggestedPolicies": [],
        })

    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json",
    }

    payload = {
        "model": ACTUAL_MODEL,
        "messages": messages,
        "max_tokens": 1024,
        "temperature": 0.7,
        "top_p": 0.9,
    }

    last_error: Exception | None = None
    for attempt in range(MAX_RETRIES):
        try:
            async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT) as client:
                response = await client.post(
                    f"{API_BASE_URL}/chat/completions",
                    headers=headers,
                    json=payload,
                )
                response.raise_for_status()
                data = response.json()
                return data["choices"][0]["message"]["content"]
        except httpx.TimeoutException as e:
            last_error = e
        except httpx.HTTPStatusError as e:
            last_error = e
        except Exception as e:
            last_error = e
        if attempt < MAX_RETRIES - 1:
            continue

    raise last_error or RuntimeError("Unable to generate response.")


# ──────────────────────────────────────────────────
# Response parsing — mirrors the Next.js route
# ──────────────────────────────────────────────────

def _parse_analysis_response(raw: str) -> dict:
    """
    Parse the LLM's JSON response.

    Strips markdown code fences if present, then validates the
    matchedCategories against the training dataset and caps the
    suggested policies at 20. Raises ValueError if the JSON is invalid.
    """
    cleaned = raw.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?\s*\n?", "", cleaned)
        cleaned = re.sub(r"\n?```\s*$", "", cleaned)

    parsed = json.loads(cleaned)  # raises ValueError on invalid JSON

    matched_categories = (
        [c for c in parsed["matchedCategories"] if c in TRAINING_CATEGORIES]
        if isinstance(parsed.get("matchedCategories"), list)
        else []
    )

    suggested_policies = (
        [
            p
            for p in parsed["suggestedPolicies"]
            if isinstance(p, dict)
            and isinstance(p.get("category"), str)
            and isinstance(p.get("description"), str)
        ][:20]
        if isinstance(parsed.get("suggestedPolicies"), list)
        else []
    )

    return {
        "matchedCategories": matched_categories,
        "systemPrompt": (
            parsed["systemPrompt"] if isinstance(parsed.get("systemPrompt"), str) else ""
        ),
        "summary": (
            parsed["summary"] if isinstance(parsed.get("summary"), str) else ""
        ),
        "suggestedPolicies": suggested_policies,
    }


# ──────────────────────────────────────────────────
# Public entry point
# ──────────────────────────────────────────────────

async def analyze_policies(
    policies: str,
    business_name: str,
    business_niche: str,
) -> dict:
    """
    Full policy analysis pipeline:

      1. Validate policy content (≥ 20 chars)
      2. Build the analysis prompt
      3. Call the LLM
      4. Parse + validate the JSON response

    Raises ValueError with a user-facing message on validation failure.
    """
    policies = policies.strip()
    if len(policies) < 20:
        raise ValueError(
            "Please provide at least 20 characters of policy content."
        )

    messages = build_analysis_prompt(policies, business_name, business_niche)
    raw = await _call_llm(messages)

    try:
        return _parse_analysis_response(raw)
    except json.JSONDecodeError:
        return {
            "matchedCategories": [],
            "systemPrompt": "",
            "summary": "Failed to parse AI response.",
            "suggestedPolicies": [],
        }
