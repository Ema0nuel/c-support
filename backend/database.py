"""
C-Support — SQLite database layer.

Handles connection management, table creation, and CRUD operations
for all Chapter Three Section 3.5.4 entities:

  1. customers
  2. conversations
  3. messages
  4. kb_documents
  5. embedding_chunks
  6. faq_categories
  7. evaluation_records
  +  business_profiles (onboarding setup that seeds the KB)

Uses aiosqlite for async compatibility with FastAPI.

The thesis describes Supabase + pgvector for the knowledge base;
this SQLite layer is the local working implementation of the same
schema. Embedding vectors are stored as JSON text and similarity
search runs in Python.
"""

from __future__ import annotations

import json
import os
import math
from datetime import datetime

import aiosqlite

DATABASE_PATH = os.getenv("DATABASE_PATH", "./c-support.db")


# ──────────────────────────────────────────────────
# Connection helper
# ──────────────────────────────────────────────────

async def get_db() -> aiosqlite.Connection:
    """Get a database connection with row factory enabled."""
    db = await aiosqlite.connect(DATABASE_PATH)
    db.row_factory = aiosqlite.Row
    return db


# ──────────────────────────────────────────────────
# Table creation — all Chapter Three entities
# ──────────────────────────────────────────────────

async def init_db():
    """Create all tables if they don't exist. Called on app startup."""
    db = await get_db()
    try:
        # 1. CUSTOMERS — user identity
        await db.execute("""
            CREATE TABLE IF NOT EXISTS customers (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # 2. CONVERSATIONS — chat session grouping
        await db.execute("""
            CREATE TABLE IF NOT EXISTS conversations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                customer_id INTEGER NOT NULL,
                title TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
            )
        """)

        # 3. MESSAGES — every exchange (user or assistant)
        await db.execute("""
            CREATE TABLE IF NOT EXISTS messages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                conversation_id INTEGER NOT NULL,
                customer_id INTEGER NOT NULL,
                content TEXT NOT NULL,
                role TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
                FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
            )
        """)

        # 4. FAQ CATEGORIES — KB organization
        await db.execute("""
            CREATE TABLE IF NOT EXISTS faq_categories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                description TEXT
            )
        """)

        # 5. KB_DOCUMENTS — knowledge base documents (business policies)
        await db.execute("""
            CREATE TABLE IF NOT EXISTS kb_documents (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                content TEXT NOT NULL,
                category_id INTEGER,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (category_id) REFERENCES faq_categories(id) ON DELETE SET NULL
            )
        """)

        # 6. EMBEDDING_CHUNKS — vector-encoded chunks (1,536-dim)
        await db.execute("""
            CREATE TABLE IF NOT EXISTS embedding_chunks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                document_id INTEGER NOT NULL,
                chunk_text TEXT NOT NULL,
                embedding TEXT NOT NULL,  -- JSON-encoded list[float]
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (document_id) REFERENCES kb_documents(id) ON DELETE CASCADE
            )
        """)

        # 7. EVALUATION_RECORDS — auto + human scores per response
        await db.execute("""
            CREATE TABLE IF NOT EXISTS evaluation_records (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                message_id INTEGER NOT NULL,
                accuracy_score REAL,
                relevance_score REAL,
                tone_score REAL,
                bleu_score REAL,
                rouge_score REAL,
                evaluator_notes TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE
            )
        """)

        # + BUSINESS PROFILES — onboarding setup (name, niche, origin)
        await db.execute("""
            CREATE TABLE IF NOT EXISTS business_profiles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                business_name TEXT NOT NULL,
                business_niche TEXT NOT NULL,
                business_origin TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        await db.commit()
    finally:
        await db.close()


# ═══════════════════════════════════════════════════
# 1. CUSTOMERS CRUD
# ═══════════════════════════════════════════════════

async def create_customer(name: str, email: str | None = None) -> dict:
    """Create a new customer. Returns the created customer as a dict."""
    db = await get_db()
    try:
        cursor = await db.execute(
            "INSERT INTO customers (name, email) VALUES (?, ?)", (name, email)
        )
        await db.commit()
        row = await db.execute("SELECT * FROM customers WHERE id = ?", (cursor.lastrowid,))
        customer = await row.fetchone()
        return dict(customer)
    finally:
        await db.close()


async def get_customer(customer_id: int) -> dict | None:
    """Fetch a customer by ID."""
    db = await get_db()
    try:
        cursor = await db.execute("SELECT * FROM customers WHERE id = ?", (customer_id,))
        row = await cursor.fetchone()
        return dict(row) if row else None
    finally:
        await db.close()


async def list_customers() -> list[dict]:
    """List all customers."""
    db = await get_db()
    try:
        cursor = await db.execute("SELECT * FROM customers ORDER BY id")
        rows = await cursor.fetchall()
        return [dict(r) for r in rows]
    finally:
        await db.close()


async def update_customer(customer_id: int, **kwargs) -> dict | None:
    """Partial update of customer fields."""
    db = await get_db()
    try:
        allowed = {"name", "email"}
        updates = {k: v for k, v in kwargs.items() if k in allowed and v is not None}
        if not updates:
            return await get_customer(customer_id)

        set_clause = ", ".join(f"{k} = ?" for k in updates.keys())
        values = list(updates.values()) + [customer_id]
        await db.execute(f"UPDATE customers SET {set_clause} WHERE id = ?", values)
        await db.commit()
        return await get_customer(customer_id)
    finally:
        await db.close()


async def delete_customer(customer_id: int) -> bool:
    db = await get_db()
    try:
        cursor = await db.execute("DELETE FROM customers WHERE id = ?", (customer_id,))
        await db.commit()
        return cursor.rowcount > 0
    finally:
        await db.close()


# ═══════════════════════════════════════════════════
# 2. CONVERSATIONS CRUD
# ═══════════════════════════════════════════════════

async def create_conversation(customer_id: int, title: str | None = None) -> dict:
    db = await get_db()
    try:
        cursor = await db.execute(
            "INSERT INTO conversations (customer_id, title) VALUES (?, ?)",
            (customer_id, title),
        )
        await db.commit()
        row = await db.execute("SELECT * FROM conversations WHERE id = ?", (cursor.lastrowid,))
        conv = await row.fetchone()
        return dict(conv)
    finally:
        await db.close()


async def get_conversation(conversation_id: int) -> dict | None:
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT * FROM conversations WHERE id = ?", (conversation_id,)
        )
        row = await cursor.fetchone()
        return dict(row) if row else None
    finally:
        await db.close()


async def list_conversations(customer_id: int) -> list[dict]:
    """List all conversations for a customer, newest first."""
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT * FROM conversations WHERE customer_id = ? ORDER BY created_at DESC",
            (customer_id,),
        )
        rows = await cursor.fetchall()
        return [dict(r) for r in rows]
    finally:
        await db.close()


async def update_conversation_title(conversation_id: int, title: str) -> dict | None:
    db = await get_db()
    try:
        await db.execute(
            "UPDATE conversations SET title = ? WHERE id = ?", (title, conversation_id)
        )
        await db.commit()
        return await get_conversation(conversation_id)
    finally:
        await db.close()


async def delete_conversation(conversation_id: int) -> bool:
    db = await get_db()
    try:
        cursor = await db.execute(
            "DELETE FROM conversations WHERE id = ?", (conversation_id,)
        )
        await db.commit()
        return cursor.rowcount > 0
    finally:
        await db.close()


# ═══════════════════════════════════════════════════
# 3. MESSAGES CRUD
# ═══════════════════════════════════════════════════

async def create_message(
    conversation_id: int,
    customer_id: int,
    content: str,
    role: str,
) -> dict:
    """Store a single message (user or assistant)."""
    db = await get_db()
    try:
        cursor = await db.execute(
            """INSERT INTO messages (conversation_id, customer_id, content, role)
               VALUES (?, ?, ?, ?)""",
            (conversation_id, customer_id, content, role),
        )
        await db.commit()
        row = await db.execute("SELECT * FROM messages WHERE id = ?", (cursor.lastrowid,))
        message = await row.fetchone()
        return dict(message)
    finally:
        await db.close()


async def get_message(message_id: int) -> dict | None:
    db = await get_db()
    try:
        cursor = await db.execute("SELECT * FROM messages WHERE id = ?", (message_id,))
        row = await cursor.fetchone()
        return dict(row) if row else None
    finally:
        await db.close()


async def list_messages(
    conversation_id: int,
    limit: int = 50,
) -> list[dict]:
    """List messages in a conversation, oldest first."""
    db = await get_db()
    try:
        cursor = await db.execute(
            """SELECT * FROM messages
               WHERE conversation_id = ?
               ORDER BY created_at ASC, id ASC
               LIMIT ?""",
            (conversation_id, limit),
        )
        rows = await cursor.fetchall()
        return [dict(r) for r in rows]
    finally:
        await db.close()


async def list_messages_for_customer(
    customer_id: int,
    conversation_id: int | None = None,
    limit: int = 50,
) -> list[dict]:
    """List messages for a customer, optionally scoped to a conversation."""
    db = await get_db()
    try:
        if conversation_id:
            cursor = await db.execute(
                """SELECT * FROM messages
                   WHERE customer_id = ? AND conversation_id = ?
                   ORDER BY created_at ASC, id ASC
                   LIMIT ?""",
                (customer_id, conversation_id, limit),
            )
        else:
            cursor = await db.execute(
                """SELECT * FROM messages
                   WHERE customer_id = ?
                   ORDER BY created_at ASC, id ASC
                   LIMIT ?""",
                (customer_id, limit),
            )
        rows = await cursor.fetchall()
        return [dict(r) for r in rows]
    finally:
        await db.close()


# ═══════════════════════════════════════════════════
# 4. FAQ CATEGORIES CRUD
# ═══════════════════════════════════════════════════

async def create_faq_category(name: str, description: str | None = None) -> dict:
    db = await get_db()
    try:
        cursor = await db.execute(
            "INSERT INTO faq_categories (name, description) VALUES (?, ?)",
            (name, description),
        )
        await db.commit()
        row = await db.execute("SELECT * FROM faq_categories WHERE id = ?", (cursor.lastrowid,))
        cat = await row.fetchone()
        return dict(cat)
    finally:
        await db.close()


async def get_faq_category(category_id: int) -> dict | None:
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT * FROM faq_categories WHERE id = ?", (category_id,)
        )
        row = await cursor.fetchone()
        return dict(row) if row else None
    finally:
        await db.close()


async def get_faq_category_by_name(name: str) -> dict | None:
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT * FROM faq_categories WHERE name = ?", (name,)
        )
        row = await cursor.fetchone()
        return dict(row) if row else None
    finally:
        await db.close()


async def list_faq_categories() -> list[dict]:
    db = await get_db()
    try:
        cursor = await db.execute("SELECT * FROM faq_categories ORDER BY name")
        rows = await cursor.fetchall()
        return [dict(r) for r in rows]
    finally:
        await db.close()


async def update_faq_category(category_id: int, **kwargs) -> dict | None:
    db = await get_db()
    try:
        allowed = {"name", "description"}
        updates = {k: v for k, v in kwargs.items() if k in allowed and v is not None}
        if not updates:
            return await get_faq_category(category_id)

        set_clause = ", ".join(f"{k} = ?" for k in updates.keys())
        values = list(updates.values()) + [category_id]
        await db.execute(f"UPDATE faq_categories SET {set_clause} WHERE id = ?", values)
        await db.commit()
        return await get_faq_category(category_id)
    finally:
        await db.close()


async def delete_faq_category(category_id: int) -> bool:
    db = await get_db()
    try:
        cursor = await db.execute(
            "DELETE FROM faq_categories WHERE id = ?", (category_id,)
        )
        await db.commit()
        return cursor.rowcount > 0
    finally:
        await db.close()


# ═══════════════════════════════════════════════════
# 5. KB_DOCUMENTS CRUD
# ═══════════════════════════════════════════════════

async def create_kb_document(
    title: str,
    content: str,
    category_id: int | None = None,
) -> dict:
    db = await get_db()
    try:
        cursor = await db.execute(
            """INSERT INTO kb_documents (title, content, category_id)
               VALUES (?, ?, ?)""",
            (title, content, category_id),
        )
        await db.commit()
        row = await db.execute("SELECT * FROM kb_documents WHERE id = ?", (cursor.lastrowid,))
        doc = await row.fetchone()
        return dict(doc)
    finally:
        await db.close()


async def get_kb_document(document_id: int) -> dict | None:
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT * FROM kb_documents WHERE id = ?", (document_id,)
        )
        row = await cursor.fetchone()
        return dict(row) if row else None
    finally:
        await db.close()


async def list_kb_documents(category_id: int | None = None) -> list[dict]:
    db = await get_db()
    try:
        if category_id:
            cursor = await db.execute(
                "SELECT * FROM kb_documents WHERE category_id = ? ORDER BY created_at DESC",
                (category_id,),
            )
        else:
            cursor = await db.execute(
                "SELECT * FROM kb_documents ORDER BY created_at DESC"
            )
        rows = await cursor.fetchall()
        return [dict(r) for r in rows]
    finally:
        await db.close()


async def update_kb_document(document_id: int, **kwargs) -> dict | None:
    db = await get_db()
    try:
        allowed = {"title", "content", "category_id"}
        updates = {k: v for k, v in kwargs.items() if k in allowed and v is not None}
        if not updates:
            return await get_kb_document(document_id)

        set_clause = ", ".join(f"{k} = ?" for k in updates.keys())
        values = list(updates.values()) + [document_id]
        await db.execute(f"UPDATE kb_documents SET {set_clause} WHERE id = ?", values)
        await db.commit()
        return await get_kb_document(document_id)
    finally:
        await db.close()


async def delete_kb_document(document_id: int) -> bool:
    db = await get_db()
    try:
        cursor = await db.execute("DELETE FROM kb_documents WHERE id = ?", (document_id,))
        await db.commit()
        return cursor.rowcount > 0
    finally:
        await db.close()


# ═══════════════════════════════════════════════════
# 6. EMBEDDING_CHUNKS CRUD
# ═══════════════════════════════════════════════════

async def create_embedding_chunk(
    document_id: int,
    chunk_text: str,
    embedding: list[float],
) -> dict:
    """Store a vector-encoded chunk. Embedding is JSON-encoded."""
    db = await get_db()
    try:
        cursor = await db.execute(
            """INSERT INTO embedding_chunks (document_id, chunk_text, embedding)
               VALUES (?, ?, ?)""",
            (document_id, chunk_text, json.dumps(embedding)),
        )
        await db.commit()
        row = await db.execute(
            "SELECT * FROM embedding_chunks WHERE id = ?", (cursor.lastrowid,)
        )
        chunk = await row.fetchone()
        result = dict(chunk)
        result["embedding"] = json.loads(result["embedding"])
        return result
    finally:
        await db.close()


async def list_embedding_chunks(document_id: int, include_embedding: bool = False) -> list[dict]:
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT * FROM embedding_chunks WHERE document_id = ? ORDER BY id",
            (document_id,),
        )
        rows = await cursor.fetchall()
        results = []
        for r in rows:
            d = dict(r)
            if include_embedding:
                d["embedding"] = json.loads(d["embedding"])
            else:
                d.pop("embedding", None)
            results.append(d)
        return results
    finally:
        await db.close()


async def delete_embedding_chunk(chunk_id: int) -> bool:
    db = await get_db()
    try:
        cursor = await db.execute(
            "DELETE FROM embedding_chunks WHERE id = ?", (chunk_id,)
        )
        await db.commit()
        return cursor.rowcount > 0
    finally:
        await db.close()


# ═══════════════════════════════════════════════════
# 7. EVALUATION_RECORDS CRUD
# ═══════════════════════════════════════════════════

async def create_evaluation_record(
    message_id: int,
    accuracy_score: float | None = None,
    relevance_score: float | None = None,
    tone_score: float | None = None,
    bleu_score: float | None = None,
    rouge_score: float | None = None,
    evaluator_notes: str | None = None,
) -> dict:
    db = await get_db()
    try:
        cursor = await db.execute(
            """INSERT INTO evaluation_records
               (message_id, accuracy_score, relevance_score, tone_score,
                bleu_score, rouge_score, evaluator_notes)
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (message_id, accuracy_score, relevance_score, tone_score,
             bleu_score, rouge_score, evaluator_notes),
        )
        await db.commit()
        row = await db.execute(
            "SELECT * FROM evaluation_records WHERE id = ?", (cursor.lastrowid,)
        )
        record = await row.fetchone()
        return dict(record)
    finally:
        await db.close()


async def get_evaluation_record(record_id: int) -> dict | None:
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT * FROM evaluation_records WHERE id = ?", (record_id,)
        )
        row = await cursor.fetchone()
        return dict(row) if row else None
    finally:
        await db.close()


async def get_evaluation_for_message(message_id: int) -> dict | None:
    """Fetch the evaluation record for a specific message."""
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT * FROM evaluation_records WHERE message_id = ? ORDER BY id DESC LIMIT 1",
            (message_id,),
        )
        row = await cursor.fetchone()
        return dict(row) if row else None
    finally:
        await db.close()


async def list_evaluation_records(limit: int = 50) -> list[dict]:
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT * FROM evaluation_records ORDER BY created_at DESC LIMIT ?",
            (limit,),
        )
        rows = await cursor.fetchall()
        return [dict(r) for r in rows]
    finally:
        await db.close()


async def update_evaluation_record(record_id: int, **kwargs) -> dict | None:
    db = await get_db()
    try:
        allowed = {
            "accuracy_score", "relevance_score", "tone_score",
            "bleu_score", "rouge_score", "evaluator_notes",
        }
        updates = {k: v for k, v in kwargs.items() if k in allowed and v is not None}
        if not updates:
            return await get_evaluation_record(record_id)

        set_clause = ", ".join(f"{k} = ?" for k in updates.keys())
        values = list(updates.values()) + [record_id]
        await db.execute(f"UPDATE evaluation_records SET {set_clause} WHERE id = ?", values)
        await db.commit()
        return await get_evaluation_record(record_id)
    finally:
        await db.close()


async def delete_evaluation_record(record_id: int) -> bool:
    db = await get_db()
    try:
        cursor = await db.execute(
            "DELETE FROM evaluation_records WHERE id = ?", (record_id,)
        )
        await db.commit()
        return cursor.rowcount > 0
    finally:
        await db.close()


# ═══════════════════════════════════════════════════
# + BUSINESS PROFILES CRUD (onboarding setup)
# ═══════════════════════════════════════════════════

async def create_business_profile(
    business_name: str,
    business_niche: str,
    business_origin: str,
) -> dict:
    db = await get_db()
    try:
        cursor = await db.execute(
            """INSERT INTO business_profiles (business_name, business_niche, business_origin)
               VALUES (?, ?, ?)""",
            (business_name, business_niche, business_origin),
        )
        await db.commit()
        row = await db.execute(
            "SELECT * FROM business_profiles WHERE id = ?", (cursor.lastrowid,)
        )
        profile = await row.fetchone()
        return dict(profile)
    finally:
        await db.close()


async def get_business_profile(business_id: int) -> dict | None:
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT * FROM business_profiles WHERE id = ?", (business_id,)
        )
        row = await cursor.fetchone()
        return dict(row) if row else None
    finally:
        await db.close()


async def list_business_profiles() -> list[dict]:
    db = await get_db()
    try:
        cursor = await db.execute("SELECT * FROM business_profiles ORDER BY id")
        rows = await cursor.fetchall()
        return [dict(r) for r in rows]
    finally:
        await db.close()


async def update_business_profile(business_id: int, **kwargs) -> dict | None:
    db = await get_db()
    try:
        allowed = {"business_name", "business_niche", "business_origin"}
        updates = {k: v for k, v in kwargs.items() if k in allowed and v is not None}
        if not updates:
            return await get_business_profile(business_id)

        set_clause = ", ".join(f"{k} = ?" for k in updates.keys())
        values = list(updates.values()) + [business_id]
        await db.execute(f"UPDATE business_profiles SET {set_clause} WHERE id = ?", values)
        await db.commit()
        return await get_business_profile(business_id)
    finally:
        await db.close()


async def delete_business_profile(business_id: int) -> bool:
    db = await get_db()
    try:
        cursor = await db.execute(
            "DELETE FROM business_profiles WHERE id = ?", (business_id,)
        )
        await db.commit()
        return cursor.rowcount > 0
    finally:
        await db.close()


# ═══════════════════════════════════════════════════
# CHAT HISTORY — reconstructed from messages table
# ═══════════════════════════════════════════════════

async def list_chat_history(
    customer_id: int,
    conversation_id: int | None = None,
    limit: int = 50,
) -> list[dict]:
    """
    Reconstruct paired exchanges from the messages table.

    Groups consecutive user/assistant messages into a single entry
    with user_input + bot_response, matching fitmate's chat_history
    shape for the thesis demo.
    """
    messages = await list_messages_for_customer(
        customer_id, conversation_id=conversation_id, limit=limit
    )

    entries = []
    pending_user: dict | None = None
    for m in messages:
        if m["role"] == "user":
            pending_user = m
        elif m["role"] == "assistant" and pending_user is not None:
            entries.append({
                "id": m["id"],
                "customer_id": m["customer_id"],
                "conversation_id": m["conversation_id"],
                "user_input": pending_user["content"],
                "bot_response": m["content"],
                "model_used": DISPLAY_MODEL_NAME,
                "guardrail_triggered": False,
                "guardrail_rule": None,
                "response_time_ms": None,
                "created_at": m["created_at"],
            })
            pending_user = None

    # Reverse to newest-first for consistency with fitmate
    return list(reversed(entries))


# Display model name used when reconstructing history.
# Kept at module level so chat.py can override it.
DISPLAY_MODEL_NAME = os.getenv("LLM_DISPLAY_MODEL", "deepseek-customer-support")


# ═══════════════════════════════════════════════════
# RAG — vector similarity search
# ═══════════════════════════════════════════════════

def _normalize(vector: list[float]) -> list[float]:
    """L2-normalize a vector for cosine similarity."""
    norm = math.sqrt(sum(x * x for x in vector))
    if norm == 0:
        return vector
    return [x / norm for x in vector]


def cosine_similarity(a: list[float], b: list[float]) -> float:
    """Cosine similarity between two vectors."""
    if not a or not b:
        return 0.0
    a_n, b_n = _normalize(a), _normalize(b)
    return sum(x * y for x, y in zip(a_n, b_n))


async def search_embedding_chunks(
    query_embedding: list[float],
    top_k: int = 5,
    threshold: float = 0.0,
) -> list[dict]:
    """
    Search embedding_chunks by cosine similarity.

    Chapter Three Section 3.5.4 RAG pipeline step 2:
      "Cosine similarity search against embedding_chunks.
       Dynamic k selection (chunks >= 0.75 similarity)."
    """
    db = await get_db()
    try:
        cursor = await db.execute(
            "SELECT ec.id, ec.document_id, ec.chunk_text, ec.embedding, kd.title AS document_title "
            "FROM embedding_chunks ec "
            "JOIN kb_documents kd ON ec.document_id = kd.id "
            "ORDER BY ec.id"
        )
        rows = await cursor.fetchall()

        scored = []
        for r in rows:
            stored = json.loads(r["embedding"])
            sim = cosine_similarity(query_embedding, stored)
            if sim >= threshold:
                scored.append({
                    "chunk_id": r["id"],
                    "document_id": r["document_id"],
                    "document_title": r["document_title"],
                    "chunk_text": r["chunk_text"],
                    "similarity": round(sim, 4),
                })

        scored.sort(key=lambda x: x["similarity"], reverse=True)
        return scored[:top_k]
    finally:
        await db.close()


async def chunk_document(content: str, chunk_size: int = 500) -> list[str]:
    """
    Split document text into overlapping chunks for embedding.

    Simple paragraph/window splitter — the working SQLite
    implementation of the thesis chunking step.
    """
    content = content.strip()
    if not content:
        return []

    # Split on paragraph boundaries first
    paragraphs = [p.strip() for p in content.split("\n\n") if p.strip()]
    chunks: list[str] = []
    current = ""

    for para in paragraphs:
        if len(current) + len(para) + 2 > chunk_size and current:
            chunks.append(current)
            current = para
        else:
            current = f"{current}\n\n{para}" if current else para

    if current:
        chunks.append(current)

    # Further split any chunk that still exceeds chunk_size
    final: list[str] = []
    for chunk in chunks:
        if len(chunk) <= chunk_size:
            final.append(chunk)
        else:
            words = chunk.split()
            buf = ""
            for word in words:
                if len(buf) + len(word) + 1 > chunk_size and buf:
                    final.append(buf)
                    buf = word
                else:
                    buf = f"{buf} {word}" if buf else word
            if buf:
                final.append(buf)

    return final
