/**
 * C-Support — Chat Store (Zustand)
 *
 * Manages the active conversation's messages and loading state.
 * Persisted to localStorage so conversations survive page refresh.
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

interface ChatState {
  messages: ChatMessage[];
  conversationId: string | null;
  isLoading: boolean;
  _hasHydrated: boolean;

  // Actions
  addUserMessage: (content: string) => void;
  addAssistantMessage: (content: string) => void;
  setLoading: (loading: boolean) => void;
  setConversationId: (id: string) => void;
  clearMessages: () => void;
  loadMessages: (msgs: ChatMessage[]) => void;
  setHasHydrated: (v: boolean) => void;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      messages: [],
      conversationId: null,
      isLoading: false,
      _hasHydrated: false,

      addUserMessage: (content) =>
        set((state) => ({
          messages: [
            ...state.messages,
            {
              id: generateId(),
              role: "user",
              content,
              timestamp: Date.now(),
            },
          ],
        })),

      addAssistantMessage: (content) =>
        set((state) => ({
          messages: [
            ...state.messages,
            {
              id: generateId(),
              role: "assistant",
              content,
              timestamp: Date.now(),
            },
          ],
        })),

      setLoading: (isLoading) => set({ isLoading }),

      setConversationId: (conversationId) => set({ conversationId }),

      clearMessages: () => set({ messages: [], conversationId: null }),

      loadMessages: (messages) => set({ messages }),

      setHasHydrated: (_hasHydrated) => set({ _hasHydrated }),
    }),
    {
      name: "c-support-chat",
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? localStorage : { getItem: () => null, setItem: () => {}, removeItem: () => {} }
      ),
      partialize: (state) => ({
        messages: state.messages,
        conversationId: state.conversationId,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
