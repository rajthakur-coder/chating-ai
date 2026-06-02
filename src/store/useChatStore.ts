"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ChatFilter = "all" | "unread" | "favourites";

type ChatState = {
  selectedChatId: string;
  filter: ChatFilter;
  draftMessage: string;
  setSelectedChatId: (selectedChatId: string) => void;
  setFilter: (filter: ChatFilter) => void;
  setDraftMessage: (draftMessage: string) => void;
  clearDraftMessage: () => void;
};

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      selectedChatId: "tech-innovators-hub",
      filter: "all",
      draftMessage: "",
      setSelectedChatId: (selectedChatId) => set({ selectedChatId }),
      setFilter: (filter) => set({ filter }),
      setDraftMessage: (draftMessage) => set({ draftMessage }),
      clearDraftMessage: () => set({ draftMessage: "" }),
    }),
    {
      name: "whatsapp-chat-store", // Key used in localStorage
    }
  )
);
