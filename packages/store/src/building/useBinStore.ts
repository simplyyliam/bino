import type { Bin, LocationSystem } from "@bino/types";
import { create } from "zustand";
import { generateLocationCode } from "@bino/data";
import { api } from "../api";
import { useStorageStore } from "./useStorageStore";
import type { IconName } from "lucide-react/dynamic";

type BinStore = {
  bins: Bin[]
  selectedBinId: string | null
  isLoading: boolean

  // Actions
  fetchBins: (storageId?: string) => Promise<void>
  setBins: (bins: Bin[]) => void
  setSelectedBinId: (id: string | null) => void
  addBin: (bin: Omit<Bin, "id">) => Promise<Bin>
  updateBin: (id: string, updateFields: Partial<Omit<Bin, "id">>) => Promise<void>
  deleteBin: (id: string) => Promise<void>
  stockBin: (id: string, itemId: string, quantity: number) => Promise<void>
  unstockBin: (id: string) => Promise<void>
  setBinQuantity: (id: string, quantity: number) => Promise<void>
  setBinOutOfService: (id: string, value: boolean) => Promise<void>
  setBinIcon: (binId: string, icon: IconName) => Promise<void>

  // Location-aware actions
  createBinInStorage: (storageId: string, binName?: string) => Promise<Bin>
  createBinsInStorage: (storageId: string, count: number) => Promise<Bin[]>
  removeLastBinFromStorage: (storageId: string) => Promise<void>
  removeLastBinsFromStorage: (storageId: string, count: number) => Promise<void>
  recalculateStorageBinCodes: (storageId: string, system: LocationSystem) => Promise<void>

  // Helpers
  getSelectedBin: () => Bin | undefined
  getBinsByStorage: (storageId: string) => Bin[]
}

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

  setBins: (bins) => set({ bins }),
  setSelectedBinId: (id) => set({ selectedBinId: id }),

  addBin: async (newBin) => {
    const bin = await api.post<Bin>("/api/bins", newBin);
    set((state) => ({ bins: [...state.bins, bin] }));
    return bin;
  },

  updateBin: async (id, updateFields) => {
    const bin = await api.patch<Bin>(`/api/bins/${id}`, updateFields);
    set((state) => ({
      bins: state.bins.map((b) => (b.id === id ? bin : b))
    }));
  },

  deleteBin: async (id) => {
    await api.delete(`/api/bins/${id}`);
    set((state) => ({
      bins: state.bins.filter((bin) => bin.id !== id),
      selectedBinId: state.selectedBinId === id ? null : state.selectedBinId
    }));
  },

  createBinInStorage: async (storageId, binName) => {
    // The API handles location calculation and storage expansion, and returns
    // the updated storage dimensions alongside the bin in a single round-trip.
    const { storage, ...bin } = await api.post<Bin & { storage: any }>("/api/bins", {
      storageId,
      name: binName
    });

    set((state) => ({ bins: [...state.bins, bin as Bin] }));

    useStorageStore.setState((state) => ({
      storages: state.storages.map((s) => (s.id === storageId ? storage : s))
    }));

    return bin as Bin;
  },

  createBinsInStorage: async (storageId, count) => {
    // One round-trip for N bins (e.g. "add column") instead of N sequential
    // POST /api/bins calls.
    const { bins, storage } = await api.post<{ bins: Bin[]; storage: any }>("/api/bins/batch", {
      storageId,
      count
    });

    set((state) => ({ bins: [...state.bins, ...bins] }));

    useStorageStore.setState((state) => ({
      storages: state.storages.map((s) => (s.id === storageId ? storage : s))
    }));

    return bins;
  },

  removeLastBinFromStorage: async (storageId) => {
    // Delegate to the batch path so a single "remove bin" pays one
    // round-trip (delete + recompute storage dims) instead of two.
    await get().removeLastBinsFromStorage(storageId, 1);
  },

  removeLastBinsFromStorage: async (storageId, count) => {
    const { bins } = get();
    const storageBins = bins.filter((b) => b.storageId === storageId);
    if (storageBins.length === 0) return;

    const sortedBins = [...storageBins].sort((a, b) => {
      if (a.column !== b.column) return b.column - a.column;
      return b.row - a.row;
    });

    const idsToRemove = sortedBins.slice(0, Math.min(count, sortedBins.length)).map((b) => b.id);

    // One round-trip to delete N bins and recompute storage dimensions,
    // instead of N sequential DELETE + PATCH round-trips.
    const { storage } = await api.post<{ storage: any }>("/api/bins/batch-delete", {
      storageId,
      ids: idsToRemove
    });

    set((state) => ({
      bins: state.bins.filter((bin) => !idsToRemove.includes(bin.id)),
      selectedBinId: idsToRemove.includes(state.selectedBinId ?? "") ? null : state.selectedBinId
    }));

    if (storage) {
      useStorageStore.setState((state) => ({
        storages: state.storages.map((s) => (s.id === storageId ? storage : s))
      }));
    }
  },

  recalculateStorageBinCodes: async (storageId, system) => {
    const { bins } = get();
    const storageBins = bins.filter((b) => b.storageId === storageId);

    const updated = await Promise.all(
      storageBins.map(async (bin) => {
        const locationCode = generateLocationCode(
          { level: bin.level, row: bin.row, column: bin.column, position: bin.position },
          system
        );
        if (locationCode === bin.locationCode) return bin;
        return api.patch<Bin>(`/api/bins/${bin.id}`, { locationCode });
      })
    );

    set((state) => ({
      bins: state.bins.map((bin) => updated.find((u) => u.id === bin.id) ?? bin)
    }));
  },

  stockBin: async (id, itemId, quantity) => {
    // Optimistic: simple field update on an existing bin, low conflict risk.
    const previous = get().bins;
    set((state) => ({
      bins: state.bins.map((bin) =>
        bin.id === id ? { ...bin, itemId, quantity, isOutOfService: false } : bin
      )
    }));
    try {
      await api.patch(`/api/bins/${id}`, {
        itemId,
        quantity,
        isOutOfService: false
      });
    } catch (err) {
      set({ bins: previous });
      throw err;
    }
  },

  unstockBin: async (id) => {
    const previous = get().bins;
    set((state) => ({
      bins: state.bins.map((bin) =>
        bin.id === id ? { ...bin, itemId: undefined, quantity: 0 } : bin
      )
    }));
    try {
      await api.patch(`/api/bins/${id}`, {
        itemId: null,
        quantity: 0
      });
    } catch (err) {
      set({ bins: previous });
      throw err;
    }
  },

  setBinQuantity: async (id, quantity) => {
    const clampedQuantity = Math.max(0, quantity);
    const previous = get().bins;
    set((state) => ({
      bins: state.bins.map((bin) =>
        bin.id === id ? { ...bin, quantity: clampedQuantity } : bin
      )
    }));
    try {
      await api.patch(`/api/bins/${id}`, { quantity: clampedQuantity });
    } catch (err) {
      set({ bins: previous });
      throw err;
    }
  },

  setBinOutOfService: async (id, value) => {
    const previous = get().bins;
    set((state) => ({
      bins: state.bins.map((bin) =>
        bin.id === id ? { ...bin, isOutOfService: value } : bin
      )
    }));
    try {
      await api.patch(`/api/bins/${id}`, { isOutOfService: value });
    } catch (err) {
      set({ bins: previous });
      throw err;
    }
  },

  setBinIcon: async (binId, icon) => {
    const previous = get().bins;
    set((state) => ({
      bins: state.bins.map((bin) =>
        bin.id === binId ? { ...bin, icon } : bin
      )
    }));
    try {
      await api.patch(`/api/bins/${binId}`, { icon });
    } catch (err) {
      set({ bins: previous });
      throw err;
    }
  },

  getSelectedBin: () => {
    const { bins, selectedBinId } = get();
    return bins.find((bin) => bin.id === selectedBinId);
  },

  getBinsByStorage: (storageId) => {
    const { bins } = get();
    return bins.filter((bin) => bin.storageId === storageId);
  }
}));
