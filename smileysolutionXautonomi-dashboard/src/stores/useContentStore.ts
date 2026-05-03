import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import type { ContentPiece, ContentStatus, ClientPersona } from "@/types/content";

interface InboxFilters {
  tab: "all" | "starred" | "today";
  persona: ClientPersona | null;
  source: "scoutbot" | "telegram" | "apify" | "manual" | null;
}

interface ContentState {
  // Focused card index for keyboard navigation
  focusedInboxIndex: number | null;

  // Inbox filters
  inboxFilters: InboxFilters;

  // Optimistic status overrides (id → status)
  optimisticStatuses: Record<string, ContentStatus>;

  // Command palette
  commandPaletteOpen: boolean;

  // Actions
  setFocusedInboxIndex: (index: number | null) => void;
  setInboxFilter: (filter: Partial<InboxFilters>) => void;
  setOptimisticStatus: (id: string, status: ContentStatus) => void;
  clearOptimisticStatus: (id: string) => void;
  toggleCommandPalette: () => void;
  setCommandPaletteOpen: (open: boolean) => void;
}

export const useContentStore = create<ContentState>()(
  immer((set) => ({
    focusedInboxIndex: null,
    inboxFilters: {
      tab: "all",
      persona: null,
      source: null,
    },
    optimisticStatuses: {},
    commandPaletteOpen: false,

    setFocusedInboxIndex: (index) =>
      set((state) => {
        state.focusedInboxIndex = index;
      }),

    setInboxFilter: (filter) =>
      set((state) => {
        Object.assign(state.inboxFilters, filter);
      }),

    setOptimisticStatus: (id, status) =>
      set((state) => {
        state.optimisticStatuses[id] = status;
      }),

    clearOptimisticStatus: (id) =>
      set((state) => {
        delete state.optimisticStatuses[id];
      }),

    toggleCommandPalette: () =>
      set((state) => {
        state.commandPaletteOpen = !state.commandPaletteOpen;
      }),

    setCommandPaletteOpen: (open) =>
      set((state) => {
        state.commandPaletteOpen = open;
      }),
  }))
);
