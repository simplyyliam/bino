import type { Building } from "@bino/types";
import { create } from "zustand";
import { api } from "../api";
import { useStorageStore } from "./useStorageStore";
import { useBinStore } from "./useBinStore";
import { useMovementHistoryStore } from "./useMovementHistoryStore";
import { useItemStore } from "./useItemStore";
import { useTimelineFilterStore } from "../ui/useTimelineFilterStore";

type BuildingState = {
  buildings: Building[]
  selectedBuildingId: string | null
  isLoading: boolean

  // Actions
  fetchBuildings: () => Promise<void>
  setSelectedBuildingId: (id: string | null) => void
  setBuildings: (buildings: Building[]) => void
  addBuilding: (building: { name: string; buildingNumber: string }) => Promise<Building>
  updateBuilding: (id: string, updateFields: Partial<Omit<Building, "id">>) => Promise<void>
  deleteBuilding: (id: string) => Promise<void>

  // Helper
  getSelectedBuilding: () => Building | undefined
}

export const useBuildingStore = create<BuildingState>()((set, get) => ({
  buildings: [],
  selectedBuildingId: null,
  isLoading: false,

  fetchBuildings: async () => {
    set({ isLoading: true });
    try {
      const buildings = await api.get<Building[]>("/api/buildings");
      set({ buildings, isLoading: false });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  setSelectedBuildingId: (id) => set({ selectedBuildingId: id }),

  setBuildings: (buildings) => set({ buildings }),

  addBuilding: async (newBuilding) => {
    const building = await api.post<Building>("/api/buildings", newBuilding);
    set((state) => ({ buildings: [...state.buildings, building] }));
    return building;
  },

  updateBuilding: async (id, updateFields) => {
    const previous = get().buildings;
    set((state) => ({
      buildings: state.buildings.map((b) => (b.id === id ? { ...b, ...updateFields } : b))
    }));
    try {
      const building = await api.patch<Building>(`/api/buildings/${id}`, updateFields);
      set((state) => ({
        buildings: state.buildings.map((b) => (b.id === id ? building : b))
      }));
    } catch (err) {
      set({ buildings: previous });
      throw err;
    }
  },

  deleteBuilding: async (id) => {
    await api.delete(`/api/buildings/${id}`);

    // The API cascades storages/bins/history via Prisma onDelete rules.
    // Mirror that locally so the UI updates without a refetch.
    const storagesToRemove = useStorageStore.getState().storages.filter(
      (storage) => storage.buildingId === id
    );
    const storageIds = new Set(storagesToRemove.map((storage) => storage.id));

    const binsToRemove = useBinStore.getState().bins.filter(
      (bin) => storageIds.has(bin.storageId)
    );
    const binIds = new Set(binsToRemove.map((bin) => bin.id));

    if (binIds.size > 0) {
      useItemStore.getState().removeBinItemsForBins(binIds);
      useMovementHistoryStore.setState((state) => ({
        history: state.history.filter(
          (event) =>
            !(
              (event.binId && binIds.has(event.binId)) ||
              (event.fromBinId && binIds.has(event.fromBinId)) ||
              (event.toBinId && binIds.has(event.toBinId))
            )
        )
      }));

      useBinStore.setState((state) => ({
        bins: state.bins.filter((bin) => !binIds.has(bin.id)),
        selectedBinId: binIds.has(state.selectedBinId ?? "") ? null : state.selectedBinId
      }));
    }

    if (storageIds.size > 0) {
      useStorageStore.setState((state) => ({
        storages: state.storages.filter((storage) => !storageIds.has(storage.id)),
        selectedStorageId: storageIds.has(state.selectedStorageId ?? "") ? null : state.selectedStorageId
      }));
    }

    if (useTimelineFilterStore.getState().selectedBuildingId === id) {
      useTimelineFilterStore.getState().setSelectedBuildingId(null);
    }

    set((state) => ({
      buildings: state.buildings.filter((building) => building.id !== id),
      selectedBuildingId: state.selectedBuildingId === id ? null : state.selectedBuildingId
    }));
  },

  getSelectedBuilding: () => {
    const { buildings, selectedBuildingId } = get()
    return buildings.find((building) => building.id === selectedBuildingId)
  }
}))
