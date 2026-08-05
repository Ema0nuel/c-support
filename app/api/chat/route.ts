import { NextRequest } from "next/server";
import { callLLM, type Message } from "@/lib/chat";
import { buildAgentSystemPrompt } from "@/lib/agent";

/**
 * Chat API — the working brain of the demo agent.
 *
 * The frontend sends the conversation so far plus the agent's context
 * (business, agent, personality, scope, handoff). This route stitches a
 * system prompt from that context, appends the conversation, and calls
 * the LLM. Stateless per lib/chat.ts design — no DB writes here.
 */
interface ChatContext {
  businessName?: string;
  businessNiche?: string;
  agentName?: string;
  personalityId?: string;
  enabledCategories?: string[];
  handoffMessage?: string;
  baseSystemPrompt?: string;
  policiesExcerpt?: string;
}

interface ChatRequest {
  messages: Message[];
  context?: ChatContext;
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { messages, context = {} } = body;

    // ─── Validation ─────────────────────────────────
    if (!Array.isArray(messages) || messages.length === 0) {
      return Response.json(
        { error: "Messages are required." },
        { status: 400 }
      );
    }

    if (
      messages.some(
        (m) =>
          !m ||
          typeof m.content !== "string" ||
          !["system", "user", "assistant"].includes(m.role)
      )
    ) {
      return Response.json(
        { error: "Invalid message format." },
        { status: 400 }
      );
    }

    // Cap message history to keep requests bounded.
    const history = messages.slice(-20);

    // ─── Build the agent prompt ─────────────────────
    const baseSystemPrompt = [
      context.businessName?.trim() &&
        `You are the support agent for ${context.businessName.trim()}.`,
      context.businessNiche?.trim() &&
        `Business niche: ${context.businessNiche.trim()}.`,
      context.agentName?.trim() &&
        `Your name is ${context.agentName.trim()} and customers address you by that name.`,
      context.policiesExcerpt?.trim() &&
        `Knowledge base summary: ${context.policiesExcerpt.trim()}`,
    ]
      .filter(Boolean)
      .join(" ");

    const systemPrompt = buildAgentSystemPrompt({
      baseSystemPrompt,
      personalityId: context.personalityId || "professional",
      enabledCategories: context.enabledCategories || [],
      handoffMessage: context.handoffMessage || "",
    });

    const llmMessages: Message[] = [
      { role: "system", content: systemPrompt },
      ...history.filter((m) => m.role !== "system"),
    ];

    // ─── Call the LLM ───────────────────────────────
    const content = await callLLM(llmMessages);

    return Response.json({ content });
  } catch (err) {
    return Response.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "An unexpected error occurred while generating a response.",
      },
      { status: 500 }
    );
  }
}
