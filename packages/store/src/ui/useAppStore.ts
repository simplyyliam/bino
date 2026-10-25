import { create } from "zustand";
import { useBuildingStore } from "../building/useBuildingStore";
import { useStorageStore } from "../building/useStorageStore";
import { useBinStore } from "../building/useBinStore";
import { useItemStore } from "../building/useItemStore";
import { useLocationSystemStore } from "../building/useLocationSystemStore";
import { useMovementHistoryStore } from "../building/useMovementHistoryStore";

type AppStatus = "idle" | "loading" | "ready" | "error";

interface AppStore {
  status: AppStatus;
  error: string | null;
  // True once a load has taken long enough that the server is probably waking up.
  isSlow: boolean;
  load: () => Promise<void>;
}

const SLOW_AFTER_MS = 4000;

export const useAppStore = create<AppStore>()((set, get) => ({
  status: "idle",
  error: null,
  isSlow: false,

  load: async () => {
    if (get().status === "loading") return;
    set({ status: "loading", error: null, isSlow: false });
    const slowTimer = setTimeout(() => set({ isSlow: true }), SLOW_AFTER_MS);

    try {
      // Each store fetches its own slice; all in parallel.
      await Promise.all([
        useLocationSystemStore.getState().fetchLocationSystems(),
        useBuildingStore.getState().fetchBuildings(),
        useStorageStore.getState().fetchStorages(),
        useBinStore.getState().fetchBins(),
        useItemStore.getState().fetchItems(),
        useItemStore.getState().fetchICNs(),
        useItemStore.getState().fetchBinItems(),
        useMovementHistoryStore.getState().fetchHistory(),
      ]);
      set({ status: "ready" });
    } catch (err) {
      console.error("Failed to load initial data from API", err);
      set({
        status: "error",
        error: err instanceof Error ? err.message : "Couldn't reach the server",
      });
    } finally {
      clearTimeout(slowTimer);
      set({ isSlow: false });
    }
  },
}));
