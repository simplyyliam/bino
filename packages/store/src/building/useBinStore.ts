import type { Bin, MovementHistoryEvent, Storage } from "@bino/types";
import type { IconName } from "lucide-react/dynamic";
import { create } from "zustand";
import { api } from "../api";
import { useStorageStore } from "./useStorageStore";
import { useItemStore } from "./useItemStore";
import { useMovementHistoryStore } from "./useMovementHistoryStore";

type BinStore = {
  bins: Bin[]
  selectedBinId: string | null
  isLoading: boolean

  fetchBins: (storageId?: string) => Promise<void>
  setSelectedBinId: (id: string | null) => void
  updateBin: (id: string, updateFields: Partial<Omit<Bin, "id">>) => Promise<void>
  setBinOutOfService: (id: string, value: boolean) => Promise<void>
  setBinIcon: (binId: string, icon: IconName | null) => Promise<void>

  createBinsInStorage: (storageId: string, count: number) => Promise<Bin[]>
  removeBinsFromStorage: (storageId: string, ids: string[]) => Promise<void>
  removeLastBinsFromStorage: (storageId: string, count: number) => Promise<void>
}

// When bins go, the server cascades their items and history too.
// Do the same here so nothing stale hangs around in the UI.
const forgetBinsLocally = (binIds: Set<string>) => {
  useItemStore.getState().removeBinItemsForBins(binIds);
  useMovementHistoryStore.setState((state) => ({
    history: state.history.filter((event) => !(event.binId && binIds.has(event.binId))),
  }));
};

const replaceStorage = (storage: Storage | null) => {
  if (!storage) return;
  useStorageStore.setState((state) => ({
    storages: state.storages.map((s) => (s.id === storage.id ? storage : s)),
  }));
};

// Last bin = highest column, then lowest row in that column.
export const sortBinsLastFirst = (bins: Bin[]) =>
  [...bins].sort((a, b) => (a.column !== b.column ? b.column - a.column : b.row - a.row));

export const useBinStore = create<BinStore>()((set, get) => ({
  bins: [],
  selectedBinId: null,
  isLoading: false,

  fetchBins: async (storageId) => {
    set({ isLoading: true });
    try {
      const path = storageId ? `/api/bins?storageId=${storageId}` : "/api/bins";
      const bins = await api.get<Bin[]>(path);
      set({ bins, isLoading: false });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  setSelectedBinId: (id) => set({ selectedBinId: id }),

  updateBin: async (id, updateFields) => {
    const previous = get().bins;
    set((state) => ({
      bins: state.bins.map((b) => (b.id === id ? { ...b, ...updateFields } : b)),
    }));
    try {
      const bin = await api.patch<Bin>(`/api/bins/${id}`, updateFields);
      set((state) => ({ bins: state.bins.map((b) => (b.id === id ? bin : b)) }));
    } catch (err) {
      set({ bins: previous });
      throw err;
    }
  },

  setBinOutOfService: async (id, value) => {
    const previous = get().bins;
    set((state) => ({
      bins: state.bins.map((bin) => (bin.id === id ? { ...bin, isOutOfService: value } : bin)),
    }));
    try {
      const { historyEvent } = await api.post<{ bin: Bin; historyEvent: MovementHistoryEvent | null }>(
        `/api/bins/${id}/service`,
        { isOutOfService: value }
      );
      useMovementHistoryStore.getState().pushEvent(historyEvent);
    } catch (err) {
      set({ bins: previous });
      throw err;
    }
  },

  setBinIcon: async (binId, icon) => {
    await get().updateBin(binId, { icon: icon ?? undefined });
  },

  createBinsInStorage: async (storageId, count) => {
    const { bins, storage } = await api.post<{ bins: Bin[]; storage: Storage }>("/api/bins/batch", {
      storageId,
      count,
    });
    set((state) => ({ bins: [...state.bins, ...bins] }));
    replaceStorage(storage);
    return bins;
  },

  removeBinsFromStorage: async (storageId, ids) => {
    if (ids.length === 0) return;
    const { storage } = await api.post<{ storage: Storage | null }>("/api/bins/batch-delete", {
      storageId,
      ids,
    });

    const removed = new Set(ids);
    forgetBinsLocally(removed);
    set((state) => ({
      bins: state.bins.filter((bin) => !removed.has(bin.id)),
      selectedBinId: removed.has(state.selectedBinId ?? "") ? null : state.selectedBinId,
    }));
    replaceStorage(storage);
  },

  removeLastBinsFromStorage: async (storageId, count) => {
    const storageBins = get().bins.filter((b) => b.storageId === storageId);
    const ids = sortBinsLastFirst(storageBins).slice(0, count).map((b) => b.id);
    await get().removeBinsFromStorage(storageId, ids);
  },
}));
