/**
 * C-Support — Conversation Persistence (localStorage)
 *
 * CRUD operations for conversations stored in localStorage.
 * Mirrors the FastAPI backend schema from the thesis (Chapter 3, Section 3.5.4)
 * but uses localStorage for the working demo.
 */

import { classifyIntent } from "./intent-classifier";

const STORAGE_KEY = "c-support-conversations";

// ─── Types ───────────────────────────────────────

export interface LocalMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  responseTime?: number; // ms between user send and agent reply
}

export interface LocalConversation {
  id: string;
  title: string;
  messages: LocalMessage[];
  createdAt: number;
  updatedAt: number;
}

interface LocalConversationsData {
  conversations: LocalConversation[];
  _counter: number;
}

// ─── Helpers ─────────────────────────────────────

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function readData(): LocalConversationsData {
  if (typeof window === "undefined") {
    return { conversations: [], _counter: 0 };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { conversations: [], _counter: 0 };
    return JSON.parse(raw) as LocalConversationsData;
  } catch {
    return { conversations: [], _counter: 0 };
  }
}

function writeData(data: LocalConversationsData): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Storage full — evict oldest 20%
    const sorted = [...data.conversations].sort(
      (a, b) => a.updatedAt - b.updatedAt
    );
    const keep = sorted.slice(Math.ceil(sorted.length * 0.2));
    data.conversations = keep;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // Still full — give up silently
    }
  }
}

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

// ─── CRUD ────────────────────────────────────────

export function createConversation(firstMessage: string): LocalConversation {
  const data = readData();
  const id = generateId();
  const conversation: LocalConversation = {
    id,
    title: truncate(firstMessage, 60),
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  data.conversations.unshift(conversation);
  data._counter += 1;
  writeData(data);
  return conversation;
}

export function addMessage(
  conversationId: string,
  message: Omit<LocalMessage, "id" | "timestamp">
): LocalMessage | null {
  const data = readData();
  const convo = data.conversations.find((c) => c.id === conversationId);
  if (!convo) return null;

  const fullMessage: LocalMessage = {
    id: generateId(),
    timestamp: Date.now(),
    ...message,
  };

  convo.messages.push(fullMessage);
  convo.updatedAt = Date.now();
  writeData(data);
  return fullMessage;
}

export function getConversation(
  conversationId: string
): LocalConversation | null {
  const data = readData();
  return data.conversations.find((c) => c.id === conversationId) ?? null;
}

export function listConversations(): LocalConversation[] {
  const data = readData();
  return [...data.conversations].sort((a, b) => b.updatedAt - a.updatedAt);
}

export function getRecentConversations(limit = 5): LocalConversation[] {
  return listConversations().slice(0, limit);
}

export function deleteConversation(conversationId: string): boolean {
  const data = readData();
  const idx = data.conversations.findIndex((c) => c.id === conversationId);
  if (idx === -1) return false;
  data.conversations.splice(idx, 1);
  writeData(data);
  return true;
}

export function updateConversationTitle(
  conversationId: string,
  title: string
): boolean {
  const data = readData();
  const convo = data.conversations.find((c) => c.id === conversationId);
  if (!convo) return false;
  convo.title = title;
  convo.updatedAt = Date.now();
  writeData(data);
  return true;
}

export function getConversationStats(): {
  totalConversations: number;
  totalMessages: number;
  avgResponseTime: number;
} {
  const data = readData();
  let totalMessages = 0;
  let totalResponseTime = 0;
  let responseCount = 0;

  for (const convo of data.conversations) {
    totalMessages += convo.messages.length;
    for (const msg of convo.messages) {
      if (msg.responseTime) {
        totalResponseTime += msg.responseTime;
        responseCount += 1;
      }
    }
  }

  return {
    totalConversations: data.conversations.length,
    totalMessages,
    avgResponseTime:
      responseCount > 0
        ? Math.round((totalResponseTime / responseCount / 1000) * 10) / 10
        : 1.2, // default placeholder
  };
}

export function getConversationIntents(conversation: LocalConversation): string[] {
  const intents = new Set<string>();
  for (const msg of conversation.messages) {
    if (msg.role === "user") {
      const classified = classifyIntent(msg.content);
      if (classified.intent !== "unclear" && classified.intent !== "greeting") {
        intents.add(classified.intent);
      }
    }
  }
  return Array.from(intents).slice(0, 3);
}
