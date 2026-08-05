"""
C-Support — Pydantic data models.

Defines request/response schemas for all API endpoints.
Maps to Chapter Three Section 3.5.4 database entities.

Entities (per the ER diagram):
  1. customers — user identity
  2. conversations — chat session grouping
  3. messages — every exchange (user + agent)
  4. kb_documents — knowledge base documents (business policies)
  5. embedding_chunks — vector-encoded chunks (1,536-dim)
  6. faq_categories — categories for KB organization
  7. evaluation_records — auto + human scores per response

Plus the onboarding profile that seeds the knowledge base.
"""

from __future__ import annotations

from pydantic import BaseModel, Field


# ═══════════════════════════════════════════════════
# 1. CUSTOMERS — Chapter Three: "Stores user identity.
#    The end user asking questions through the support
#    interface."
# ═══════════════════════════════════════════════════

class CustomerCreate(BaseModel):
    """Create a customer."""
    name: str = Field(..., min_length=1, max_length=100, examples=["Ada Obi"])
    email: str | None = Field(
        None,
        max_length=200,
        examples=["ada@example.com"],
        description="Optional email — used for follow-up context",
    )


class CustomerUpdate(BaseModel):
    """Partial update for a customer."""
    name: str | None = Field(None, min_length=1, max_length=100)
    email: str | None = Field(None, max_length=200)


class CustomerResponse(BaseModel):
    id: int
    name: str
    email: str | None = None
    created_at: str | None = None


# ═══════════════════════════════════════════════════
# 2. CONVERSATIONS — Chapter Three: "Groups chat
#    sessions. A conversation collects the exchanges
#    between one customer and the support agent."
# ═══════════════════════════════════════════════════

class ConversationCreate(BaseModel):
    customer_id: int
    title: str | None = Field(None, max_length=200)


class ConversationUpdate(BaseModel):
    title: str | None = Field(None, max_length=200)


class ConversationResponse(BaseModel):
    id: int
    customer_id: int
    title: str | None = None
    created_at: str | None = None


# ═══════════════════════════════════════════════════
# 3. MESSAGES — Chapter Three: "Stores every exchange.
#    Each message belongs to a conversation and is
#    authored by either the customer (user) or the
#    support agent (assistant)."
# ═══════════════════════════════════════════════════

class MessageCreate(BaseModel):
    conversation_id: int
    customer_id: int
    content: str = Field(..., min_length=1, max_length=8000)
    role: str = Field(
        "user",
        pattern=r"^(user|assistant)$",
        description="user = customer message, assistant = agent response",
    )


class MessageResponse(BaseModel):
    id: int
    conversation_id: int
    customer_id: int
    content: str
    role: str
    created_at: str | None = None


# ═══════════════════════════════════════════════════
# 4. KB_DOCUMENTS — Chapter Three: "Stores knowledge
#    base documents. For C-Support these are the
#    business policies collected during onboarding."
# ═══════════════════════════════════════════════════

class KbDocumentCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=300)
    content: str = Field(..., min_length=1, max_length=200000)
    category_id: int | None = Field(None, description="Optional faq_categories.id")


class KbDocumentUpdate(BaseModel):
    title: str | None = Field(None, min_length=1, max_length=300)
    content: str | None = Field(None, min_length=1, max_length=200000)
    category_id: int | None = None


class KbDocumentResponse(BaseModel):
    id: int
    title: str
    content: str
    category_id: int | None = None
    created_at: str | None = None


# ═══════════════════════════════════════════════════
# 5. EMBEDDING_CHUNKS — Chapter Three: "Stores the
#    vector-encoded chunks. 1,536-dim embeddings from
#    text-embedding-3-small. Retrieved via cosine
#    similarity in the RAG pipeline."
# ═══════════════════════════════════════════════════

class EmbeddingChunkCreate(BaseModel):
    document_id: int
    chunk_text: str = Field(..., min_length=1)
    embedding: list[float] = Field(..., min_length=1, description="1,536-dim vector")


class EmbeddingChunkResponse(BaseModel):
    id: int
    document_id: int
    chunk_text: str
    embedding: list[float] | None = None  # omitted from list responses for size
    created_at: str | None = None


# ═══════════════════════════════════════════════════
# 6. FAQ_CATEGORIES — Chapter Three: "Organizes the
#    knowledge base. Maps to the training dataset
#    categories (REFUND, SHIPPING, RETURNS, ...)."
# ═══════════════════════════════════════════════════

class FaqCategoryCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, examples=["REFUND", "SHIPPING"])
    description: str | None = Field(None, max_length=500)


class FaqCategoryUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=100)
    description: str | None = Field(None, max_length=500)


class FaqCategoryResponse(BaseModel):
    id: int
    name: str
    description: str | None = None


# ═══════════════════════════════════════════════════
# 7. EVALUATION_RECORDS — Chapter Three: "Stores auto
#    and human scores per response: accuracy,
#    relevance, tone, plus academic metrics BLEU and
#    ROUGE. Used for the thesis evaluation framework."
# ═══════════════════════════════════════════════════

class EvaluationRecordCreate(BaseModel):
    message_id: int
    accuracy_score: float | None = Field(None, ge=0.0, le=1.0)
    relevance_score: float | None = Field(None, ge=0.0, le=1.0)
    tone_score: float | None = Field(None, ge=0.0, le=1.0)
    bleu_score: float | None = Field(None, ge=0.0, le=1.0)
    rouge_score: float | None = Field(None, ge=0.0, le=1.0)
    evaluator_notes: str | None = Field(None, max_length=2000)


class EvaluationRecordUpdate(BaseModel):
    accuracy_score: float | None = Field(None, ge=0.0, le=1.0)
    relevance_score: float | None = Field(None, ge=0.0, le=1.0)
    tone_score: float | None = Field(None, ge=0.0, le=1.0)
    bleu_score: float | None = Field(None, ge=0.0, le=1.0)
    rouge_score: float | None = Field(None, ge=0.0, le=1.0)
    evaluator_notes: str | None = Field(None, max_length=2000)


class EvaluationRecordResponse(BaseModel):
    id: int
    message_id: int
    accuracy_score: float | None = None
    relevance_score: float | None = None
    tone_score: float | None = None
    bleu_score: float | None = None
    rouge_score: float | None = None
    evaluator_notes: str | None = None
    created_at: str | None = None


# ═══════════════════════════════════════════════════
# BUSINESS ONBOARDING — the front-end wizard collects
# business name, niche, origin and policies. The
# policies become the knowledge base (kb_documents);
# the profile seeds the system prompt.
# ═══════════════════════════════════════════════════

class BusinessProfileCreate(BaseModel):
    """Business setup collected during onboarding."""
    business_name: str = Field(..., min_length=2, max_length=100)
    business_niche: str = Field(..., min_length=1, max_length=200)
    business_origin: str = Field(..., min_length=10, max_length=2000)


class BusinessProfileUpdate(BaseModel):
    business_name: str | None = Field(None, min_length=2, max_length=100)
    business_niche: str | None = Field(None, min_length=1, max_length=200)
    business_origin: str | None = Field(None, min_length=10, max_length=2000)


class BusinessProfileResponse(BaseModel):
    id: int
    business_name: str
    business_niche: str
    business_origin: str
    created_at: str | None = None


# ──────────────────────────────────────────────────
# Policy analysis — mirrors app/api/onboarding/analyze
# ──────────────────────────────────────────────────

class PolicyAnalysisRequest(BaseModel):
    """Same contract as the Next.js /api/onboarding/analyze route."""
    policies: str = Field(..., min_length=20, description="Raw policy text")
    business_name: str = Field(..., min_length=1)
    business_niche: str = Field(..., min_length=1)


class SuggestedPolicy(BaseModel):
    category: str
    description: str


class PolicyAnalysisResponse(BaseModel):
    """Knowledge base profile returned to the wizard."""
    matchedCategories: list[str]
    systemPrompt: str
    summary: str
    suggestedPolicies: list[SuggestedPolicy]


# ──────────────────────────────────────────────────
# Chat — request / response for the chat endpoint
# ──────────────────────────────────────────────────

class ChatRequest(BaseModel):
    """Send a customer message to the support agent."""
    customer_id: int
    message: str = Field(..., min_length=1, max_length=2000)
    conversation_id: int | None = Field(
        None, description="If None, a new conversation is created"
    )


class ChatResponse(BaseModel):
    """The support agent's reply."""
    response: str
    conversation_id: int
    guardrail_triggered: bool = False
    guardrail_rule: str | None = None
    model_used: str | None = None


# ──────────────────────────────────────────────────
# RAG search — vector retrieval result
# ──────────────────────────────────────────────────

class RetrievalResult(BaseModel):
    chunk_id: int
    document_id: int
    document_title: str
    chunk_text: str
    similarity: float


class RAGSearchResponse(BaseModel):
    query: str
    results: list[RetrievalResult]
    retrieval_count: int
    dynamic_k: int | None = None


# ──────────────────────────────────────────────────
# Onboarding status
# ──────────────────────────────────────────────────

class OnboardingStatusResponse(BaseModel):
    """Quick check: has the business completed onboarding?"""
    has_profile: bool
    onboarding_complete: bool
    business_id: int | None = None


# ──────────────────────────────────────────────────
# Chat history entry
# ──────────────────────────────────────────────────

class ChatHistoryEntry(BaseModel):
    """A single stored exchange (customer input + agent response)."""
    id: int
    customer_id: int
    conversation_id: int | None = None
    user_input: str
    bot_response: str
    model_used: str | None = None
    guardrail_triggered: bool = False
    guardrail_rule: str | None = None
    response_time_ms: int | None = None
    created_at: str | None = None
