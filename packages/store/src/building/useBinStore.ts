import type { Bin } from "@bino/types";
import { getNextBinLocation, generateLocationCode, expandStorage } from "@bino/data";
import { create } from "zustand";
import { useStorageStore } from "./useStorageStore";
import { useLocationSystemStore } from "./useLocationSystemStore";

type BinState = {
  bins: Bin[]
  selectedBinId: string | null

  // Actions
  setBins: (bins: Bin[]) => void
  setSelectedBinId: (id: string | null) => void
  addBin: (bin: Bin) => void
  updateBin: (id: string, updateFields: Partial<Omit<Bin, "id">>) => void
  deleteBin: (id: string) => void

  // Location-aware actions
  createBinInStorage: (storageId: string, binName: string) => Bin

  // Helpers
  getSelectedBin: () => Bin | undefined
  getBinsByStorage: (storageId: string) => Bin[]
}

export const useBinStore = create<BinState>((set, get) => ({
  bins: [],
  selectedBinId: null,

  setBins: (bins) => set({ bins }),
  setSelectedBinId: (id) => set({ selectedBinId: id }),
  addBin: (newBin) =>
    set((state) => ({
      bins: [...state.bins, newBin]
    })),
  updateBin: (id, updateFields) =>
    set((state) => ({
      bins: state.bins.map((bin) => bin.id === id ? { ...bin, ...updateFields } : bin)
    })),
  deleteBin: (id) =>
    set((state) => ({
      bins: state.bins.filter((bin) => bin.id !== id),
      selectedBinId: state.selectedBinId === id ? null : state.selectedBinId
    })),

  createBinInStorage: (storageId, binName) => {
    const { bins } = get();
    const storage = useStorageStore.getState().storages.find(s => s.id === storageId);
    const locationSystem = useLocationSystemStore.getState().locationSystems.find(
      ls => ls.id === storage?.locationSystemId
    );

    if (!storage || !locationSystem) {
      throw new Error("Storage or location system not found");
    }

    // Get bins for this storage
    const storageBins = bins.filter(b => b.storageId === storageId);

    // Calculate next location
    const nextLocation = getNextBinLocation(storage, storageBins);

    // Generate location code
    const locationCode = generateLocationCode(nextLocation, locationSystem);

    // Create the new bin
    const newBin: Bin = {
      id: `bin-${Date.now()}`,
      storageId,
      name: binName,
      locationCode,
      level: nextLocation.level,
      row: nextLocation.row,
      column: nextLocation.column,
      position: nextLocation.position
    };

    // Expand storage dimensions if needed
    const updatedStorage = expandStorage(storage, nextLocation);
    useStorageStore.getState().updateStorage(storageId, {
      maxLevel: updatedStorage.maxLevel,
      maxRow: updatedStorage.maxRow,
      maxColumn: updatedStorage.maxColumn
    });

    // Add the bin
    get().addBin(newBin);

    return newBin;
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
