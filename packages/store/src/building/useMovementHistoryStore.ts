import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { MovementHistoryEvent } from "@bino/types";

interface MovementHistoryStore {
  history: MovementHistoryEvent[];

  // Add a new history event
  addHistoryEvent: (event: Omit<MovementHistoryEvent, "id" | "timestamp">) => void;

  // Query history
  getHistoryForBin: (binId: string, limit?: number) => MovementHistoryEvent[];
  getHistoryForItem: (itemId: string, limit?: number) => MovementHistoryEvent[];
  getHistoryForICN: (icnId: string, limit?: number) => MovementHistoryEvent[];
  getRecentHistory: (limit?: number) => MovementHistoryEvent[];

  // Clear history (for testing/reset)
  clearHistory: () => void;
}

export const useMovementHistoryStore = create<MovementHistoryStore>()(
  persist(
    (set, get) => ({
  history: [],

  addHistoryEvent: (event) => {
    const newEvent: MovementHistoryEvent = {
      ...event,
      id: `history-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
    };

    set((state) => ({
      history: [newEvent, ...state.history], // Newest first
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
    }),
    {
      name: "bino-movement-history-storage"
    }
  )
);
