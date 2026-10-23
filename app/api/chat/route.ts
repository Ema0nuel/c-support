import { NextRequest } from "next/server";
import {
  callLLMWithMetadata,
  LLMServiceError,
  type Message,
} from "@/lib/chat";

/**
 * Server-side OpenRouter proxy for the customer support panel.
 *
 * The middleware builds the complete prompt before calling this route. The
 * browser sends messages only; provider credentials remain on the server.
 */
const MAX_MESSAGES = 24;
const MAX_MESSAGE_LENGTH = 12_000;
const MAX_TOTAL_LENGTH = 48_000;
const VALID_ROLES = new Set<Message["role"]>(["system", "user", "assistant"]);

function validateMessages(value: unknown): value is Message[] {
  if (!Array.isArray(value) || value.length === 0 || value.length > MAX_MESSAGES) {
    return false;
  }

  let totalLength = 0;
  for (const message of value) {
    if (
      !message ||
      typeof message !== "object" ||
      !("role" in message) ||
      !("content" in message) ||
      typeof message.role !== "string" ||
      !VALID_ROLES.has(message.role as Message["role"]) ||
      typeof message.content !== "string" ||
      message.content.trim().length === 0 ||
      message.content.length > MAX_MESSAGE_LENGTH
    ) {
      return false;
    }

    totalLength += message.content.length;
    if (totalLength > MAX_TOTAL_LENGTH) return false;
  }

  return true;
}

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();
    const messages = body && typeof body === "object" && "messages" in body
      ? body.messages
      : undefined;

    if (!validateMessages(messages)) {
      return Response.json(
        { error: "A valid, bounded message list is required." },
        { status: 400 },
      );
    }

    const completion = await callLLMWithMetadata(messages);

    return Response.json({
      content: completion.content,
      model_used: completion.model,
    });
  } catch (err) {
    console.error("[chat] error:", err instanceof Error ? err.message : String(err));

    if (err instanceof SyntaxError) {
      return Response.json({ error: "Invalid JSON body." }, { status: 400 });
    }

    if (err instanceof LLMServiceError) {
      const error = err.status === 503
        ? "AI service is not configured."
        : err.status === 504
          ? "AI service timed out. Please try again."
          : "AI service is temporarily unavailable.";
      return Response.json({ error }, { status: err.status });
    }

    return Response.json(
      { error: "An unexpected error occurred while generating a response." },
      { status: 500 },
    );
  }
}
