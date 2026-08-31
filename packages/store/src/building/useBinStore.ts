import type { Bin } from "@bino/types";
import { getNextBinLocation, generateLocationCode, expandStorage } from "@bino/data";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useStorageStore } from "./useStorageStore";
import { useLocationSystemStore } from "./useLocationSystemStore";
import type { IconName } from "lucide-react/dynamic";

type BinStore = {
  bins: Bin[]
  selectedBinId: string | null

  // Actions
  setBins: (bins: Bin[]) => void
  setSelectedBinId: (id: string | null) => void
  addBin: (bin: Bin) => void
  updateBin: (id: string, updateFields: Partial<Omit<Bin, "id">>) => void
  deleteBin: (id: string) => void
  stockBin: (id: string, itemId: string, quantity: number) => void
  unstockBin: (id: string) => void
  setBinQuantity: (id: string, quantity: number) => void
  setBinOutOfService: (id: string, value: boolean) => void
  setBinIcon: (binId: string, icon: IconName) => void;

  // Location-aware actions
  createBinInStorage: (storageId: string, binName?: string) => Bin
  removeLastBinFromStorage: (storageId: string) => void
  recalculateStorageBinCodes: (storageId: string, system: import("@bino/types").LocationSystem) => void

  // Helpers
  getSelectedBin: () => Bin | undefined
  getBinsByStorage: (storageId: string) => Bin[]
}

export const useBinStore = create<BinStore>()(
  persist(
    (set, get) => ({
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

        const storageBins = bins.filter(b => b.storageId === storageId);
        const nextLocation = getNextBinLocation(storage, storageBins, locationSystem);
        const locationCode = generateLocationCode(nextLocation, locationSystem);

        const newBin: Bin = {
          id: crypto.randomUUID(),
          storageId,
          name: binName || `Bin ${storageBins.length + 1}`,
          locationCode,
          level: nextLocation.level,
          row: nextLocation.row,
          column: nextLocation.column,
          position: nextLocation.position,

          itemId: undefined,
          quantity: 0,
          isOutOfService: false
        };

        const updatedStorage = expandStorage(storage, nextLocation);
        useStorageStore.getState().updateStorage(storageId, {
          maxLevel: updatedStorage.maxLevel,
          maxRow: updatedStorage.maxRow,
          maxColumn: updatedStorage.maxColumn
        });

        get().addBin(newBin);
        return newBin;
      },

      removeLastBinFromStorage: (storageId) => {
        const { bins } = get();
        const storageBins = bins.filter(b => b.storageId === storageId);
        if (storageBins.length === 0) return;

        // Sort bins to find the one with highest column then highest row
        const sortedBins = [...storageBins].sort((a, b) => {
          if (a.column !== b.column) return b.column - a.column;
          return b.row - a.row;
        });

        const binToRemove = sortedBins[0];
        get().deleteBin(binToRemove.id);

        // Recalculate dimensions for the storage
        const remainingBins = storageBins.filter(b => b.id !== binToRemove.id);
        const maxLevel = remainingBins.length > 0 ? Math.max(...remainingBins.map(b => b.level)) : 0;
        const maxRow = remainingBins.length > 0 ? Math.max(...remainingBins.map(b => b.row)) : 0;
        const maxColumn = remainingBins.length > 0 ? Math.max(...remainingBins.map(b => b.column)) : 0;

        useStorageStore.getState().updateStorage(storageId, {
          maxLevel,
          maxRow,
          maxColumn
        });
      },

      recalculateStorageBinCodes: (storageId, system) => {
        set((state) => ({
          bins: state.bins.map((bin) => {
            if (bin.storageId !== storageId) return bin;
            const locationCode = generateLocationCode(
              {
                level: bin.level,
                row: bin.row,
                column: bin.column,
                position: bin.position
              },
              system
            );
            return { ...bin, locationCode };
          })
        }));
      },

      getSelectedBin: () => {
        const { bins, selectedBinId } = get();
        return bins.find((bin) => bin.id === selectedBinId);
      },
      getBinsByStorage: (storageId) => {
        const { bins } = get();
        return bins.filter((bin) => bin.storageId === storageId);
      },


      stockBin: (id, itemId, quantity) => {
        set((state) => ({
          bins: state.bins.map((bin) =>
            bin.id === id ? {
              ...bin,
              itemId,
              quantity,
              isOutOfService: false
            } : bin
          )
        }))
      },

      unstockBin: (id) => {
        set((state) => ({
          bins: state.bins.map((bin) =>
            bin.id === id ? {
              ...bin,
              itemId: undefined,
              quantity: 0,
            } : bin
          )
        }))
      },
      setBinQuantity: (id, quantity) => {
        set((state) => ({
          bins: state.bins.map((bin) =>
            bin.id === id ? {
              ...bin,
              quantity: Math.max(0, quantity),
            } : bin
          )
        }))
      },
      setBinOutOfService: (id, value) => {
        set((state) => ({
          bins: state.bins.map((bin) =>
            bin.id === id ? {
              ...bin,
              isOutOfService: value
            } : bin
          )
        }))
      },
      setBinIcon: (binId, icon) => {
        set((state) => ({
          bins: state.bins.map((bin) =>
            bin.id === binId
              ? { ...bin, icon }
              : bin
          )
        }))
      }
    }),
    {
      name: "bino-bins-storage"
    }
  )
);
