import type { Building } from "@bino/types";
import { create } from "zustand";

const INITIAL_BUILDINGS: Building[] = [
  // {
  //   id: "building-001",
  //   name: "QStores",
  //   buildingNumber: "01"
  // },
  // {
  //   id: "building-002",
  //   name: "WStores",
  //   buildingNumber: "02"
  // },
]

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

export const useBuildingStore = create<BuildingState>((set, get) => ({
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
  deleteBuilding: (id) =>
    set((state) => ({
      buildings: state.buildings.filter((building) => building.id !== id),
      selectedBuildingId: state.selectedBuildingId === id ? null : state.selectedBuildingId
    })),
  getSelectedBuilding: () => {
    const { buildings, selectedBuildingId } = get()
    return buildings.find((building) => building.id === selectedBuildingId)
  }
}))
