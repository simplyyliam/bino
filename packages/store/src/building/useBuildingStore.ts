import type { Building } from "@bino/types";
import { create } from "zustand";
import { api } from "../api";
import { useStorageStore } from "./useStorageStore";
import { useBinStore } from "./useBinStore";
import { useMovementHistoryStore } from "./useMovementHistoryStore";
import { useItemStore } from "./useItemStore";

type BuildingState = {
  buildings: Building[]
  isLoading: boolean

  fetchBuildings: () => Promise<void>
  addBuilding: (building: { name: string; buildingNumber: string }) => Promise<Building>
  updateBuilding: (id: string, updateFields: Partial<Omit<Building, "id">>) => Promise<void>
  deleteBuilding: (id: string) => Promise<void>
}

export const useBuildingStore = create<BuildingState>()((set, get) => ({
  buildings: [],
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

    // The server cascades storages, bins and their history. Do the same
    // locally so the UI catches up without refetching everything.
    const storageIds = new Set(
      useStorageStore.getState().storages.filter((s) => s.buildingId === id).map((s) => s.id)
    );
    const binIds = new Set(
      useBinStore.getState().bins.filter((b) => storageIds.has(b.storageId)).map((b) => b.id)
    );
    const touchesBin = (binId?: string) => !!binId && binIds.has(binId);

    useItemStore.getState().removeBinItemsForBins(binIds);
    useMovementHistoryStore.setState((state) => ({
      history: state.history.filter((e) => !(touchesBin(e.binId) || touchesBin(e.fromBinId) || touchesBin(e.toBinId)))
    }));
    useBinStore.setState((state) => ({ bins: state.bins.filter((b) => !binIds.has(b.id)) }));
    useStorageStore.setState((state) => ({ storages: state.storages.filter((s) => !storageIds.has(s.id)) }));
    set((state) => ({ buildings: state.buildings.filter((b) => b.id !== id) }));
  },
}))
