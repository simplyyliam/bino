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

  // Add a new history event
  addHistoryEvent: (event: Omit<MovementHistoryEvent, "id" | "timestamp">) => Promise<void>;

  // Delete history events by id (does delete from the DB)
  deleteHistoryEvents: (ids: string[]) => Promise<void>;

  // Query history (operates on whatever is currently loaded in state)
  getHistoryForBin: (binId: string, limit?: number) => MovementHistoryEvent[];
  getHistoryForItem: (itemId: string, limit?: number) => MovementHistoryEvent[];
  getHistoryForICN: (icnId: string, limit?: number) => MovementHistoryEvent[];
  getRecentHistory: (limit?: number) => MovementHistoryEvent[];

  // Clear history locally (for testing/reset) - does not delete from the DB
  clearHistory: () => void;
}

export const useMovementHistoryStore = create<MovementHistoryStore>()((set, get) => ({
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

  addHistoryEvent: async (event) => {
    const newEvent = await api.post<MovementHistoryEvent>("/api/movement-history", event);
    get().pushEvent(newEvent);
  },

  deleteHistoryEvents: async (ids) => {
    await api.delete<void>("/api/movement-history", { ids });
    const idSet = new Set(ids);
    set((state) => ({
      history: state.history.filter((event) => !idSet.has(event.id)),
    }));
  },

  getHistoryForBin: (binId, limit = 50) => {
    return get()
      .history.filter(
        (event) =>
          event.binId === binId ||
          event.fromBinId === binId ||
          event.toBinId === binId
      )
      .slice(0, limit);
  },

  getHistoryForItem: (itemId, limit = 50) => {
    return get()
      .history.filter((event) => event.itemId === itemId)
      .slice(0, limit);
  },

  getHistoryForICN: (icnId, limit = 50) => {
    return get()
      .history.filter((event) => event.icnId === icnId)
      .slice(0, limit);
  },

  getRecentHistory: (limit = 50) => {
    return get().history.slice(0, limit);
  },

  clearHistory: () => {
    set({ history: [] });
  },
}));
