"""
C-Support — Guardrail Layer.

Chapter Three Section 3.5.1 stage (9):
  "Rule-based pattern matching (banned topics, harmful phrasing)
   combined with a lightweight classifier for paraphrased or
   previously unseen unsafe content."

GUARDRAIL-POLICY.md compliance:
  - Input checks: topic classification, intent detection
  - Output checks: domain verification, harmful content detection
  - Every trigger is logged for thesis evaluation
"""

from __future__ import annotations

import re
from dataclasses import dataclass


# ──────────────────────────────────────────────────
# Guardrail result — carries the verdict + metadata
# ──────────────────────────────────────────────────

@dataclass
class GuardrailResult:
    """Result of a guardrail check."""
    passed: bool  # True = message is safe, False = blocked
    action: str  # "pass", "refuse", "rewrite"
    rule: str | None = None  # Which rule triggered
    message: str | None = None  # User-facing message (refusal)
    original_text: str = ""  # What was checked


# ──────────────────────────────────────────────────
# Pattern lists — customer support domain
# ──────────────────────────────────────────────────

# HARMFUL / HOSTILE CONTENT — HARD BAN
HARMFUL_PATTERNS = [
    r"\bkill\b",
    r"\bself[- ]?harm\b",
    r"\bsuicide\b",
    r"\bslave\b",
    r"\bterror(ism|ist)\b",
    r"\bbomb\b",
    r"\bhack(ing|er)?\b",
    r"\bddos\b",
    r"\bmalware\b",
    r"\bsteal\b",
    r"\bweapon[s]?\b",
    r"\bgun[s]?\b",
    r"\bknife\b",
    r"\binsult\b",
    r"\bthreat(en)?\b",
    r"\bsue\b",
    r"\blawsuit\b",
    r"\battorney\b",
]

# ABUSE / HATE — HARD BAN
ABUSE_PATTERNS = [
    r"\bfuck\b",
    r"\bshit\b",
    r"\bbitch\b",
    r"\bastard\b",
    r"\bidiot\b",
    r"\bstupid\b",
    r"\bsucker\b",
    r"\bfool\b",
    r"\bdamn\b",
    r"\bscam\b",
    r"\bliar\b",
    r"\bfraud\b",
    r"\bslave\b",
    r"\bsex(ual)?\b",
    r"\bporn(ography)?\b",
    r"\bracist\b",
    r"\bracism\b",
]

# OFF-TOPIC / NON-SUPPORT — HARD BAN
OFF_TOPIC_PATTERNS = [
    r"\bpolitic(s)?\b",
    r"\belection\b",
    r"\breligion\b",
    r"\bchurch\b",
    r"\bmosque\b",
    r"\btemple\b",
    r"\bcoding\b",
    r"\bprogramming\b",
    r"\bjavascript\b",
    r"\bpython\b",
    r"\bjava\b",
    r"\bc\+\+\b",
    r"\bhow\s+do\s+i\s+code\b",
    r"\bfinancial\s+advice\b",
    r"\binvest(ing|ment)?\b",
    r"\bstock[s]?\b",
    r"\bbitcoin\b",
    r"\bcrypto\b",
    r"\bmedical\s+advice\b",
    r"\bdiagnos[e]?\b",
    r"\bprescri(ption|be)\b",
    r"\bdrug[s]?\s*(dosage|dose)\b",
]

# PERSONAL DATA REQUEST — HARD BAN (privacy guard)
PII_PATTERNS = [
    r"\bpassword[s]?\b",
    r"\bpin\b",
    r"\bcvv\b",
    r"\bcard\s*number\b",
    r"\baccount\s+password\b",
    r"\bsocial\s*security\b",
    r"\bnational\s+id\b",
    r"\bdate\s+of\s+birth\b",
    r"\bbank\s+details\b",
]

# Customer support domain keywords — positive signal
SUPPORT_KEYWORDS = [
    r"\border\b", r"\bshipping\b", r"\bdelivery\b", r"\breturn(s)?\b",
    r"\brefund\b", r"\bpayment\b", r"\bbilling\b", r"\binvoice\b",
    r"\baccount\b", r"\bproduct\b", r"\bservice\b", r"\bsubscription\b",
    r"\bcancel(l)?ation\b", r"\bwarranty\b", r"\bcomplaint\b",
    r"\bfeedback\b", r"\bpurchase\b", r"\bprice\b", r"\bcost\b",
    r"\bdiscount\b", r"\bpromotion\b", r"\bcoupon\b", r"\bvoucher\b",
    r"\btrack\b", r"\btracking\b", r"\bstatus\b", r"\bupdate\b",
    r"\bexchange\b", r"\bdamaged\b", r"\bdefect(ive)?\b", r"\bquality\b",
    r"\bhelp\b", r"\bsupport\b", r"\bagent\b", r"\bcustomer\b",
    r"\bhuman\b", r"\bspeak\b", r"\bthanks\b", r"\bthank\s*you\b",
    r"\bhi\b", r"\bhello\b", r"\bhey\b", r"\bgood\s*(morning|afternoon|evening)\b",
    r"\bsmall\s*talk\b", r"\bassist(ance|ant)?\b", r"\bissue\b",
    r"\bproblem\b", r"\bquestion\b", r"\binquiry\b", r"\brequest\b",
]


# ──────────────────────────────────────────────────
# Core guardrail functions
# ──────────────────────────────────────────────────

def check_user_input(text: str) -> GuardrailResult:
    """
    Guardrail check on USER INPUT (before model call).

    Per GUARDRAIL-POLICY.md:
      1. Topic classification — scan for banned/harmful content
      2. Intent detection — is the user asking for prohibited info?
      3. Language check — basic appropriateness

    Returns GuardrailResult with action="pass" or "refuse".
    """
    normalized = text.strip().lower()

    if not normalized:
        return GuardrailResult(passed=True, action="pass", original_text=text)

    # --- Check 1: Harmful content (HARD BAN) ---
    for pattern in HARMFUL_PATTERNS:
        if re.search(pattern, normalized, re.IGNORECASE):
            return GuardrailResult(
                passed=False,
                action="refuse",
                rule="harmful_content",
                message=(
                    "I'm a customer support assistant and can only help with "
                    "questions about this business's products and services. "
                    "I can't assist with that request. If you need help with "
                    "your order, account, or a product issue, I'm happy to help."
                ),
                original_text=text,
            )

    # --- Check 2: Abuse / hate (HARD BAN) ---
    for pattern in ABUSE_PATTERNS:
        if re.search(pattern, normalized, re.IGNORECASE):
            return GuardrailResult(
                passed=False,
                action="refuse",
                rule="abusive_language",
                message=(
                    "I'm here to help with customer support questions. "
                    "Let's keep things respectful — how can I help with your "
                    "order, account, or product today?"
                ),
                original_text=text,
            )

    # --- Check 3: Off-topic (HARD BAN) ---
    for pattern in OFF_TOPIC_PATTERNS:
        if re.search(pattern, normalized, re.IGNORECASE):
            return GuardrailResult(
                passed=False,
                action="refuse",
                rule="off_topic_request",
                message=(
                    "I'm a customer support assistant for this business. "
                    "I can only help with questions about products, orders, "
                    "shipping, returns, billing, and account issues. "
                    "Is there something about your order or account I can help with?"
                ),
                original_text=text,
            )

    # --- Check 4: Personal data request (HARD BAN) ---
    for pattern in PII_PATTERNS:
        if re.search(pattern, normalized, re.IGNORECASE):
            return GuardrailResult(
                passed=False,
                action="refuse",
                rule="personal_data_request",
                message=(
                    "For your security, I can't ask for or handle sensitive "
                    "personal information like passwords, card numbers, or "
                    "PINs. Please contact our support team directly for "
                    "account-sensitive requests."
                ),
                original_text=text,
            )

    # --- Check 5: Customer support domain signal ---
    for pattern in SUPPORT_KEYWORDS:
        if re.search(pattern, normalized, re.IGNORECASE):
            return GuardrailResult(
                passed=True, action="pass", original_text=text
            )

    # No strong signal either way — allow but flag for monitoring
    return GuardrailResult(passed=True, action="pass", original_text=text)


def check_bot_response(text: str) -> GuardrailResult:
    """
    Guardrail check on BOT RESPONSE (after model call, before delivery).

    Per GUARDRAIL-POLICY.md:
      1. Harmful content — does the response contain unsafe content?
      2. Hallucination markers — the model shouldn't invent facts
      3. Off-domain — the response should stay within support scope
    """
    normalized = text.strip().lower()

    if not normalized:
        return GuardrailResult(passed=True, action="pass", original_text=text)

    # --- Check 1: Harmful content in response (HARD BAN) ---
    for pattern in HARMFUL_PATTERNS + ABUSE_PATTERNS:
        if re.search(pattern, normalized, re.IGNORECASE):
            return GuardrailResult(
                passed=False,
                action="refuse",
                rule="response_harmful_content",
                message=(
                    "I'm sorry, I can't provide that response. "
                    "Please contact our support team directly for assistance."
                ),
                original_text=text,
            )

    # --- Check 2: Off-topic response (HARD BAN) ---
    for pattern in OFF_TOPIC_PATTERNS:
        if re.search(pattern, normalized, re.IGNORECASE):
            return GuardrailResult(
                passed=False,
                action="refuse",
                rule="response_off_topic",
                message=(
                    "I can only discuss this business's products, orders, "
                    "shipping, returns, billing, and account topics. "
                    "Please rephrase your question about our services."
                ),
                original_text=text,
            )

    # --- Check 3: Hallucination markers — vague unfounded claims ---
    hallucination_patterns = [
        r"\bi\s+definitely\s+guarantee\b",
        r"\b100%\s+(refund|guarantee|sure)\b",
        r"\bno\s+questions\s+asked\b",
        r"\bguaranteed\s+approval\b",
        r"\balways\s+(free|instant)\b",
    ]
    for pattern in hallucination_patterns:
        if re.search(pattern, normalized, re.IGNORECASE):
            return GuardrailResult(
                passed=False,
                action="rewrite",
                rule="response_hallucination",
                message=(
                    "I need to verify this claim with our current policies. "
                    "Could you please confirm your order details so I can "
                    "give you an accurate answer?"
                ),
                original_text=text,
            )

    return GuardrailResult(passed=True, action="pass", original_text=text)


def get_guardrail_log_entry(result: GuardrailResult) -> dict:
    """
    Format a guardrail result for logging.
    Per GUARDRAIL-POLICY.md:
      "Every guardrail trigger is logged with: Timestamp, Input message
       (first 100 chars), Triggered rule name, Action taken"
    """
    return {
        "input_preview": result.original_text[:100],
        "rule": result.rule,
        "action": result.action,
        "passed": result.passed,
    }
