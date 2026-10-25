import { create } from "zustand";
import type { MovementHistoryEvent } from "@bino/types";
import { api } from "../api";

interface MovementHistoryStore {
  history: MovementHistoryEvent[];
  isLoading: boolean;

  // Fetch history from the API
  fetchHistory: (filters?: { binId?: string; itemId?: string; icnId?: string; limit?: number }) => Promise<void>;

  // Prepend an event the API already recorded (returned alongside a mutation)
  pushEvent: (event: MovementHistoryEvent | null | undefined) => void;

  // Delete history events by id (does delete from the DB)
  deleteHistoryEvents: (ids: string[]) => Promise<void>;
}

export const useMovementHistoryStore = create<MovementHistoryStore>()((set) => ({
  history: [],
  isLoading: false,

  fetchHistory: async (filters) => {
    set({ isLoading: true });
    try {
      const params = new URLSearchParams();
      if (filters?.binId) params.set("binId", filters.binId);
      if (filters?.itemId) params.set("itemId", filters.itemId);
      if (filters?.icnId) params.set("icnId", filters.icnId);
      if (filters?.limit) params.set("limit", String(filters.limit));

      const query = params.toString();
      const history = await api.get<MovementHistoryEvent[]>(
        `/api/movement-history${query ? `?${query}` : ""}`
      );
      set({ history, isLoading: false });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  pushEvent: (event) => {
    if (!event) return;
    set((state) =>
      state.history.some((e) => e.id === event.id)
        ? state
        : { history: [event, ...state.history] } // Newest first
    );
  },

  deleteHistoryEvents: async (ids) => {
    await api.delete<void>("/api/movement-history", { ids });
    const idSet = new Set(ids);
    set((state) => ({
      history: state.history.filter((event) => !idSet.has(event.id)),
    }));
  },
}));
