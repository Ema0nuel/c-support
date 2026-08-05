"""
C-Support — FastAPI Application (Thesis Artifact).

Matches Chapter Three Section 3.5.4 exactly: all entities get
CRUD endpoints, plus the chat pipeline, RAG search, policy
analysis, and onboarding status endpoints.

This backend is the THESIS ARTIFACT. It is complete and correct
per the methodology, but the running demo is served by the
Next.js API routes — this FastAPI app exists to match the
thesis report's architecture.
"""

from __future__ import annotations

import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

import database as db
import chat as chat_service
import analyze as analyze_service
from models import (
    BusinessProfileCreate,
    BusinessProfileResponse,
    BusinessProfileUpdate,
    ChatRequest,
    ChatResponse,
    ChatHistoryEntry,
    ConversationCreate,
    ConversationResponse,
    ConversationUpdate,
    CustomerCreate,
    CustomerResponse,
    CustomerUpdate,
    EmbeddingChunkCreate,
    EmbeddingChunkResponse,
    EvaluationRecordCreate,
    EvaluationRecordResponse,
    EvaluationRecordUpdate,
    FaqCategoryCreate,
    FaqCategoryResponse,
    FaqCategoryUpdate,
    KbDocumentCreate,
    KbDocumentResponse,
    KbDocumentUpdate,
    MessageCreate,
    MessageResponse,
    OnboardingStatusResponse,
    PolicyAnalysisRequest,
    PolicyAnalysisResponse,
    RAGSearchResponse,
    RetrievalResult,
)


# ──────────────────────────────────────────────────
# App lifespan — create tables on startup
# ──────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    await db.init_db()
    yield


app = FastAPI(
    title="C-Support API",
    version="1.0.0",
    description=(
        "AI-powered customer support system — FastAPI backend "
        "(thesis artifact, Chapter Three)."
    ),
    lifespan=lifespan,
)

# CORS — allow the Next.js dev frontend
CORS_ORIGINS = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:3001")
    .split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ═══════════════════════════════════════════════════
# Health
# ═══════════════════════════════════════════════════

@app.get("/api/health")
async def health() -> dict:
    """Service health check."""
    return {
        "status": "ok",
        "service": "c-support",
        "model": chat_service.DISPLAY_MODEL,
    }


# ═══════════════════════════════════════════════════
# CUSTOMERS — Chapter Three entity 1
# ═══════════════════════════════════════════════════

@app.post("/api/customers", response_model=CustomerResponse)
async def create_customer(payload: CustomerCreate) -> dict:
    return await db.create_customer(name=payload.name, email=payload.email)


@app.get("/api/customers", response_model=list[CustomerResponse])
async def list_customers() -> list[dict]:
    return await db.list_customers()


@app.get("/api/customers/{customer_id}", response_model=CustomerResponse)
async def get_customer(customer_id: int) -> dict:
    customer = await db.get_customer(customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer


@app.patch("/api/customers/{customer_id}", response_model=CustomerResponse)
async def update_customer(customer_id: int, payload: CustomerUpdate) -> dict:
    customer = await db.update_customer(customer_id, **payload.model_dump())
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer


@app.delete("/api/customers/{customer_id}")
async def delete_customer(customer_id: int) -> dict:
    deleted = await db.delete_customer(customer_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Customer not found")
    return {"ok": True, "deleted": customer_id}


# ═══════════════════════════════════════════════════
# CONVERSATIONS — Chapter Three entity 2
# ═══════════════════════════════════════════════════

@app.post("/api/conversations", response_model=ConversationResponse)
async def create_conversation(payload: ConversationCreate) -> dict:
    return await db.create_conversation(
        customer_id=payload.customer_id, title=payload.title
    )


@app.get(
    "/api/customers/{customer_id}/conversations",
    response_model=list[ConversationResponse],
)
async def list_customer_conversations(customer_id: int) -> list[dict]:
    return await db.list_conversations(customer_id)


@app.get("/api/conversations/{conversation_id}", response_model=ConversationResponse)
async def get_conversation(conversation_id: int) -> dict:
    conv = await db.get_conversation(conversation_id)
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return conv


@app.patch("/api/conversations/{conversation_id}", response_model=ConversationResponse)
async def update_conversation(
    conversation_id: int, payload: ConversationUpdate
) -> dict:
    conv = await db.update_conversation_title(
        conversation_id, payload.title or ""
    )
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return conv


@app.delete("/api/conversations/{conversation_id}")
async def delete_conversation(conversation_id: int) -> dict:
    deleted = await db.delete_conversation(conversation_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return {"ok": True, "deleted": conversation_id}


# ═══════════════════════════════════════════════════
# MESSAGES — Chapter Three entity 3
# ═══════════════════════════════════════════════════

@app.post("/api/messages", response_model=MessageResponse)
async def create_message(payload: MessageCreate) -> dict:
    return await db.create_message(
        conversation_id=payload.conversation_id,
        customer_id=payload.customer_id,
        content=payload.content,
        role=payload.role,
    )


@app.get(
    "/api/conversations/{conversation_id}/messages",
    response_model=list[MessageResponse],
)
async def list_messages(conversation_id: int) -> list[dict]:
    return await db.list_messages(conversation_id)


@app.get("/api/messages/{message_id}", response_model=MessageResponse)
async def get_message(message_id: int) -> dict:
    message = await db.get_message(message_id)
    if not message:
        raise HTTPException(status_code=404, detail="Message not found")
    return message


# ═══════════════════════════════════════════════════
# FAQ CATEGORIES — Chapter Three entity 4
# ═══════════════════════════════════════════════════

@app.post("/api/faq-categories", response_model=FaqCategoryResponse)
async def create_faq_category(payload: FaqCategoryCreate) -> dict:
    return await db.create_faq_category(
        name=payload.name, description=payload.description
    )


@app.get("/api/faq-categories", response_model=list[FaqCategoryResponse])
async def list_faq_categories() -> list[dict]:
    return await db.list_faq_categories()


@app.get("/api/faq-categories/{category_id}", response_model=FaqCategoryResponse)
async def get_faq_category(category_id: int) -> dict:
    cat = await db.get_faq_category(category_id)
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    return cat


@app.patch("/api/faq-categories/{category_id}", response_model=FaqCategoryResponse)
async def update_faq_category(category_id: int, payload: FaqCategoryUpdate) -> dict:
    cat = await db.update_faq_category(category_id, **payload.model_dump())
    if not cat:
        raise HTTPException(status_code=404, detail="Category not found")
    return cat


@app.delete("/api/faq-categories/{category_id}")
async def delete_faq_category(category_id: int) -> dict:
    deleted = await db.delete_faq_category(category_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Category not found")
    return {"ok": True, "deleted": category_id}


# ═══════════════════════════════════════════════════
# KB DOCUMENTS — Chapter Three entity 5
# ═══════════════════════════════════════════════════

@app.post("/api/kb-documents", response_model=KbDocumentResponse)
async def create_kb_document(payload: KbDocumentCreate) -> dict:
    return await db.create_kb_document(
        title=payload.title,
        content=payload.content,
        category_id=payload.category_id,
    )


@app.get("/api/kb-documents", response_model=list[KbDocumentResponse])
async def list_kb_documents(
    category_id: int | None = Query(None, description="Filter by FAQ category"),
) -> list[dict]:
    return await db.list_kb_documents(category_id=category_id)


@app.get("/api/kb-documents/{document_id}", response_model=KbDocumentResponse)
async def get_kb_document(document_id: int) -> dict:
    doc = await db.get_kb_document(document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc


@app.patch("/api/kb-documents/{document_id}", response_model=KbDocumentResponse)
async def update_kb_document(document_id: int, payload: KbDocumentUpdate) -> dict:
    doc = await db.update_kb_document(document_id, **payload.model_dump())
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    return doc


@app.delete("/api/kb-documents/{document_id}")
async def delete_kb_document(document_id: int) -> dict:
    deleted = await db.delete_kb_document(document_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Document not found")
    return {"ok": True, "deleted": document_id}


# ═══════════════════════════════════════════════════
# EMBEDDING CHUNKS — Chapter Three entity 6
# ═══════════════════════════════════════════════════

@app.post(
    "/api/kb-documents/{document_id}/chunks",
    response_model=list[EmbeddingChunkResponse],
)
async def chunk_and_embed_document(document_id: int) -> list[dict]:
    """
    Chunk a KB document and create embeddings for each chunk.

    This mirrors the thesis pipeline: content → chunks → 1,536-dim
    embeddings stored in embedding_chunks for vector retrieval.
    """
    doc = await db.get_kb_document(document_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    from embeddings import get_embedding

    chunks = await db.chunk_document(doc["content"])
    created = []
    for chunk_text in chunks:
        embedding = get_embedding(chunk_text)
        created.append(
            await db.create_embedding_chunk(
                document_id=document_id,
                chunk_text=chunk_text,
                embedding=embedding,
            )
        )
    return created


@app.post("/api/embedding-chunks", response_model=EmbeddingChunkResponse)
async def create_embedding_chunk(payload: EmbeddingChunkCreate) -> dict:
    return await db.create_embedding_chunk(
        document_id=payload.document_id,
        chunk_text=payload.chunk_text,
        embedding=payload.embedding,
    )


@app.get(
    "/api/kb-documents/{document_id}/chunks",
    response_model=list[EmbeddingChunkResponse],
)
async def list_document_chunks(document_id: int) -> list[dict]:
    return await db.list_embedding_chunks(document_id)


@app.delete("/api/embedding-chunks/{chunk_id}")
async def delete_embedding_chunk(chunk_id: int) -> dict:
    deleted = await db.delete_embedding_chunk(chunk_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Chunk not found")
    return {"ok": True, "deleted": chunk_id}


# ═══════════════════════════════════════════════════
# EVALUATION RECORDS — Chapter Three entity 7
# ═══════════════════════════════════════════════════

@app.post("/api/evaluations", response_model=EvaluationRecordResponse)
async def create_evaluation(payload: EvaluationRecordCreate) -> dict:
    return await db.create_evaluation_record(
        message_id=payload.message_id,
        accuracy_score=payload.accuracy_score,
        relevance_score=payload.relevance_score,
        tone_score=payload.tone_score,
        bleu_score=payload.bleu_score,
        rouge_score=payload.rouge_score,
        evaluator_notes=payload.evaluator_notes,
    )


@app.get("/api/evaluations", response_model=list[EvaluationRecordResponse])
async def list_evaluations(limit: int = Query(50, ge=1, le=200)) -> list[dict]:
    return await db.list_evaluation_records(limit=limit)


@app.get("/api/evaluations/{record_id}", response_model=EvaluationRecordResponse)
async def get_evaluation(record_id: int) -> dict:
    record = await db.get_evaluation_record(record_id)
    if not record:
        raise HTTPException(status_code=404, detail="Evaluation record not found")
    return record


@app.get(
    "/api/messages/{message_id}/evaluation",
    response_model=EvaluationRecordResponse,
)
async def get_evaluation_for_message(message_id: int) -> dict:
    record = await db.get_evaluation_for_message(message_id)
    if not record:
        raise HTTPException(
            status_code=404, detail="No evaluation record for this message"
        )
    return record


@app.patch(
    "/api/evaluations/{record_id}", response_model=EvaluationRecordResponse
)
async def update_evaluation(record_id: int, payload: EvaluationRecordUpdate) -> dict:
    record = await db.update_evaluation_record(record_id, **payload.model_dump())
    if not record:
        raise HTTPException(status_code=404, detail="Evaluation record not found")
    return record


@app.delete("/api/evaluations/{record_id}")
async def delete_evaluation(record_id: int) -> dict:
    deleted = await db.delete_evaluation_record(record_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Evaluation record not found")
    return {"ok": True, "deleted": record_id}


# ═══════════════════════════════════════════════════
# BUSINESS PROFILES — onboarding setup
# ═══════════════════════════════════════════════════

@app.post("/api/business-profiles", response_model=BusinessProfileResponse)
async def create_business_profile(payload: BusinessProfileCreate) -> dict:
    return await db.create_business_profile(
        business_name=payload.business_name,
        business_niche=payload.business_niche,
        business_origin=payload.business_origin,
    )


@app.get("/api/business-profiles", response_model=list[BusinessProfileResponse])
async def list_business_profiles() -> list[dict]:
    return await db.list_business_profiles()


@app.get(
    "/api/business-profiles/{business_id}",
    response_model=BusinessProfileResponse,
)
async def get_business_profile(business_id: int) -> dict:
    profile = await db.get_business_profile(business_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Business profile not found")
    return profile


@app.patch(
    "/api/business-profiles/{business_id}",
    response_model=BusinessProfileResponse,
)
async def update_business_profile(
    business_id: int, payload: BusinessProfileUpdate
) -> dict:
    profile = await db.update_business_profile(
        business_id, **payload.model_dump()
    )
    if not profile:
        raise HTTPException(status_code=404, detail="Business profile not found")
    return profile


@app.delete("/api/business-profiles/{business_id}")
async def delete_business_profile(business_id: int) -> dict:
    deleted = await db.delete_business_profile(business_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Business profile not found")
    return {"ok": True, "deleted": business_id}


# ═══════════════════════════════════════════════════
# ONBOARDING — policy analysis + status
# ═══════════════════════════════════════════════════

@app.post("/api/onboarding/analyze", response_model=PolicyAnalysisResponse)
async def analyze_policies(payload: PolicyAnalysisRequest) -> dict:
    """Mirror of app/api/onboarding/analyze/route.ts."""
    try:
        return await analyze_service.analyze_policies(
            policies=payload.policies,
            business_name=payload.business_name,
            business_niche=payload.business_niche,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e


@app.get("/api/onboarding/status", response_model=OnboardingStatusResponse)
async def onboarding_status() -> dict:
    """Has the business completed onboarding?"""
    profiles = await db.list_business_profiles()
    return {
        "has_profile": len(profiles) > 0,
        "onboarding_complete": len(profiles) > 0,
        "business_id": profiles[-1]["id"] if profiles else None,
    }


# ═══════════════════════════════════════════════════
# CHAT — the core interaction pipeline
# ═══════════════════════════════════════════════════

@app.post("/api/chat", response_model=ChatResponse)
async def chat(payload: ChatRequest) -> dict:
    """Full chat pipeline: guardrails → RAG → LLM → response."""
    result = await chat_service.process_chat_message(
        customer_id=payload.customer_id,
        message=payload.message,
        conversation_id=payload.conversation_id,
    )
    if result.get("error") == "customer_not_found":
        raise HTTPException(status_code=404, detail="Customer not found")
    return {
        "response": result["response"],
        "conversation_id": result["conversation_id"],
        "guardrail_triggered": result["guardrail_triggered"],
        "guardrail_rule": result["guardrail_rule"],
        "model_used": result["model_used"],
    }


@app.get(
    "/api/customers/{customer_id}/chat-history",
    response_model=list[ChatHistoryEntry],
)
async def chat_history(
    customer_id: int,
    conversation_id: int | None = Query(None),
    limit: int = Query(50, ge=1, le=200),
) -> list[dict]:
    """Reconstructed user/assistant exchange history for a customer."""
    return await db.list_chat_history(
        customer_id=customer_id,
        conversation_id=conversation_id,
        limit=limit,
    )


# ═══════════════════════════════════════════════════
# RAG SEARCH — vector retrieval for the thesis demo
# ═══════════════════════════════════════════════════

@app.post("/api/rag/search", response_model=RAGSearchResponse)
async def rag_search(query: str, top_k: int = Query(5, ge=1, le=20)) -> dict:
    """Encode a query and retrieve matching knowledge base chunks."""
    from embeddings import get_embedding

    query_embedding = get_embedding(query)
    results = await db.search_embedding_chunks(
        query_embedding=query_embedding,
        top_k=top_k,
        threshold=chat_service.SIMILARITY_THRESHOLD,
    )
    return {
        "query": query,
        "results": [RetrievalResult(**r).model_dump() for r in results],
        "retrieval_count": len(results),
        "dynamic_k": len(results),
    }
