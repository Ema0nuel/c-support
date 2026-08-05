"""
C-Support — Embedding layer.

Chapter Three RAG pipeline step 1:
  "Encode query → vector. 1,536-dim embeddings from
   OpenAI text-embedding-3-small."

Two paths:
  1. If LLM_API_KEY is set, calls the OpenAI-compatible
     embeddings endpoint (OpenCode-Zen / text-embedding-3-small).
  2. Otherwise falls back to a deterministic local embedding
     (hash-based bag-of-words) so the thesis artifact is fully
     runnable without external API keys.

Both paths produce a fixed DIMENSION-dimensional vector so the
vector search layer is agnostic to the source.
"""

from __future__ import annotations

import hashlib
import math
import os
import re

import httpx

API_BASE_URL = os.getenv("LLM_API_BASE_URL", "https://api.opencode-zen.com/v1")
API_KEY = os.getenv("LLM_API_KEY", "")
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "text-embedding-3-small")

# Fixed dimension — matches text-embedding-3-small
DIMENSION = 1536


# ──────────────────────────────────────────────────
# Local fallback — deterministic hash-based bag-of-words
# ──────────────────────────────────────────────────

def _tokenize(text: str) -> list[str]:
    """Lowercase, split on word boundaries, drop stopwords-ish noise."""
    tokens = re.findall(r"[a-z0-9']+", text.lower())
    stopwords = {
        "the", "a", "an", "and", "or", "but", "for", "with", "from", "to",
        "of", "in", "on", "at", "by", "is", "are", "was", "were", "be",
        "been", "this", "that", "these", "those", "it", "its", "as", "if",
        "do", "does", "did", "i", "you", "we", "they", "he", "she", "will",
        "would", "can", "could", "should", "have", "has", "had", "not", "no",
    }
    return [t for t in tokens if t not in stopwords and len(t) > 1]


def _feature_index(token: str) -> int:
    """Map a token to a stable index in [0, DIMENSION)."""
    digest = hashlib.sha256(token.encode("utf-8")).digest()
    return int.from_bytes(digest[:4], "big") % DIMENSION


def local_embedding(text: str) -> list[float]:
    """Deterministic bag-of-words embedding → DIMENSION vector."""
    vector = [0.0] * DIMENSION
    for token in _tokenize(text):
        vector[_feature_index(token)] += 1.0

    # L2-normalize
    norm = math.sqrt(sum(x * x for x in vector))
    if norm > 0:
        vector = [x / norm for x in vector]
    return vector


# ──────────────────────────────────────────────────
# Public API — get_embedding
# ──────────────────────────────────────────────────

def get_embedding(text: str) -> list[float]:
    """
    Produce a DIMENSION-dimensional embedding for text.

    Uses the configured embedding API when an API key is present,
    otherwise the local deterministic fallback.
    """
    if API_KEY:
        try:
            return _api_embedding(text)
        except Exception:
            # Graceful fallback — artifact stays runnable offline
            return local_embedding(text)
    return local_embedding(text)


def _api_embedding(text: str) -> list[float]:
    """Call the OpenAI-compatible embeddings endpoint."""
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {"model": EMBEDDING_MODEL, "input": text}

    with httpx.Client(timeout=30.0) as client:
        response = client.post(
            f"{API_BASE_URL}/embeddings",
            headers=headers,
            json=payload,
        )
        response.raise_for_status()
        data = response.json()

    vector = data["data"][0]["embedding"]
    # Normalize to the fixed dimension contract
    if len(vector) != DIMENSION:
        if len(vector) > DIMENSION:
            return vector[:DIMENSION]
        return vector + [0.0] * (DIMENSION - len(vector))
    return vector
