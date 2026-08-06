/**
 * C-Support — Conversations Store (Zustand)
 *
 * Manages conversation list, selection, and CRUD operations.
 * Persisted to localStorage via Zustand's persist middleware.
 *
 * Follows store/agent.ts pattern exactly:
 * - persist + createJSONStorage(localStorage)
 * - partialize to persist only data (not actions/hydration flag)
 * - onRehydrateStorage sets _hasHydrated
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  listConversations,
  getConversation,
  createConversation,
  deleteConversation as libDeleteConversation,
  updateConversationTitle as libUpdateTitle,
  addMessage as libAddMessage,
  type LocalConversation,
  type LocalMessage,
} from "@/lib/conversations";

interface ConversationsState {
  conversations: LocalConversation[];
  selectedId: string | null;
  _hasHydrated: boolean;

  // Actions
  loadConversations: () => void;
  selectConversation: (id: string | null) => void;
  addConversation: (firstMessage: string) => LocalConversation;
  deleteConversation: (id: string) => void;
  updateTitle: (id: string, title: string) => void;
  addMessage: (
    conversationId: string,
    message: Omit<LocalMessage, "id" | "timestamp">
  ) => LocalMessage | null;
  refresh: () => void;
  setHasHydrated: (v: boolean) => void;
}

export const useConversationsStore = create<ConversationsState>()(
  persist(
    (set, get) => ({
      conversations: [],
      selectedId: null,
      _hasHydrated: false,

      loadConversations: () => {
        set({ conversations: listConversations() });
      },

      selectConversation: (id) => set({ selectedId: id }),

      addConversation: (firstMessage) => {
        const convo = createConversation(firstMessage);
        set({ conversations: listConversations() });
        return convo;
      },

      deleteConversation: (id) => {
        libDeleteConversation(id);
        set((state) => ({
          conversations: state.conversations.filter((c) => c.id !== id),
          selectedId: state.selectedId === id ? null : state.selectedId,
        }));
      },

      updateTitle: (id, title) => {
        libUpdateTitle(id, title);
        set((state) => ({
          conversations: state.conversations.map((c) =>
            c.id === id ? { ...c, title, updatedAt: Date.now() } : c
          ),
        }));
      },

      addMessage: (conversationId, message) => {
        const result = libAddMessage(conversationId, message);
        if (result) {
          set({ conversations: listConversations() });
        }
        return result;
      },

      refresh: () => {
        set({ conversations: listConversations() });
      },

      setHasHydrated: (_hasHydrated) => set({ _hasHydrated }),
    }),
    {
      name: "c-support-conversations-state",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        conversations: state.conversations,
        selectedId: state.selectedId,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);