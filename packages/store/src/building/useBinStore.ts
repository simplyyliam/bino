import type { Bin } from "@bino/types";
import { create } from "zustand";
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
    // The API handles location calculation and storage expansion
    const bin = await api.post<Bin>("/api/bins", {
      storageId,
      name: binName
    });

    set((state) => ({ bins: [...state.bins, bin] }));

    // Refresh the storage to get updated dimensions
    const storage = await api.get<any>(`/api/storages/${storageId}`);
    useStorageStore.setState((state) => ({
      storages: state.storages.map((s) => (s.id === storageId ? storage : s))
    }));

    return bin;
  },

  stockBin: async (id, itemId, quantity) => {
    await api.patch(`/api/bins/${id}`, {
      itemId,
      quantity,
      isOutOfService: false
    });
    set((state) => ({
      bins: state.bins.map((bin) =>
        bin.id === id ? { ...bin, itemId, quantity, isOutOfService: false } : bin
      )
    }));
  },

  unstockBin: async (id) => {
    await api.patch(`/api/bins/${id}`, {
      itemId: null,
      quantity: 0
    });
    set((state) => ({
      bins: state.bins.map((bin) =>
        bin.id === id ? { ...bin, itemId: undefined, quantity: 0 } : bin
      )
    }));
  },

  setBinQuantity: async (id, quantity) => {
    const clampedQuantity = Math.max(0, quantity);
    await api.patch(`/api/bins/${id}`, { quantity: clampedQuantity });
    set((state) => ({
      bins: state.bins.map((bin) =>
        bin.id === id ? { ...bin, quantity: clampedQuantity } : bin
      )
    }));
  },

  setBinOutOfService: async (id, value) => {
    await api.patch(`/api/bins/${id}`, { isOutOfService: value });
    set((state) => ({
      bins: state.bins.map((bin) =>
        bin.id === id ? { ...bin, isOutOfService: value } : bin
      )
    }));
  },

  setBinIcon: async (binId, icon) => {
    await api.patch(`/api/bins/${binId}`, { icon });
    set((state) => ({
      bins: state.bins.map((bin) =>
        bin.id === binId ? { ...bin, icon } : bin
      )
    }));
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
