import type { Building } from "@bino/types";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useStorageStore } from "./useStorageStore";
import { useBinStore } from "./useBinStore";
import { useMovementHistoryStore } from "./useMovementHistoryStore";
import { useTimelineFilterStore } from "../ui/useTimelineFilterStore";

type BuildingState = {
  buildings: Building[]
  selectedBuildingId: string | null

  // Actions
  setBuildings: (buildings: Building[]) => void
  setSelectedBuildingId: (id: string | null) => void
  addBuilding: (building: Building) => void
  updateBuilding: (id: string, updateFields: Partial<Omit<Building, "id">>) => void
  deleteBuilding: (id: string) => void

  // Helper
  getSelectedBuilding: () => Building | undefined
}

export const useBuildingStore = create<BuildingState>()(
  persist(
    (set, get) => ({
      buildings: [],
      selectedBuildingId: null,

      setBuildings: (buildings) => set({ buildings }),
      setSelectedBuildingId: (id) => set({ selectedBuildingId: id }),
      addBuilding: (newBuilding) =>
        set((state) => ({
          buildings: [...state.buildings, newBuilding]
        })),
      updateBuilding: (id, updateFields) =>
        set((state) => ({
          buildings: state.buildings.map((building) => building.id === id ? { ...building, ...updateFields } : building)
        })),
      deleteBuilding: (id) => {
        // Cascade: remove storages/bins that belong to this building, and any
        // movement history events tied to those bins, so no orphaned timeline remains.
        const storagesToRemove = useStorageStore.getState().storages.filter(
          (storage) => storage.buildingId === id
        );
        const storageIds = new Set(storagesToRemove.map((storage) => storage.id));

        const binsToRemove = useBinStore.getState().bins.filter(
          (bin) => storageIds.has(bin.storageId)
        );
        const binIds = new Set(binsToRemove.map((bin) => bin.id));

        if (binIds.size > 0) {
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
        }

        if (binIds.size > 0) {
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

        // Clear the building filter if it pointed at the building being removed.
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
    }),
    {
      name: "bino-buildings-storage"
    }
  )
)
