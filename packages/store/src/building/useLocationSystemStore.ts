import type { LocationSystem } from "@bino/types";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { LocationSystems } from "@bino/data";

type LocationSystemState = {
  locationSystems: LocationSystem[]
  selectedLocationSystemId: string | null

  // Actions
  setLocationSystems: (systems: LocationSystem[]) => void
  setSelectedLocationSystemId: (id: string | null) => void
  addLocationSystem: (system: LocationSystem) => void
  updateLocationSystem: (id: string, updateFields: Partial<Omit<LocationSystem, "id">>) => void
  deleteLocationSystem: (id: string) => void

  // Helpers
  getSelectedLocationSystem: () => LocationSystem | undefined
  getLocationSystemById: (id: string) => LocationSystem | undefined
}

export const useLocationSystemStore = create<LocationSystemState>()(
  persist(
    (set, get) => ({
      locationSystems: LocationSystems, // Initialize with default systems
      selectedLocationSystemId: null,

      setLocationSystems: (systems) => set({ locationSystems: systems }),
      setSelectedLocationSystemId: (id) => set({ selectedLocationSystemId: id }),
      addLocationSystem: (newSystem) =>
        set((state) => ({
          locationSystems: [...state.locationSystems, newSystem]
        })),
      updateLocationSystem: (id, updateFields) =>
        set((state) => ({
          locationSystems: state.locationSystems.map((system) =>
            system.id === id ? { ...system, ...updateFields } : system
          )
        })),
      deleteLocationSystem: (id) =>
        set((state) => ({
          locationSystems: state.locationSystems.filter((system) => system.id !== id),
          selectedLocationSystemId: state.selectedLocationSystemId === id ? null : state.selectedLocationSystemId
        })),
      getSelectedLocationSystem: () => {
        const { locationSystems, selectedLocationSystemId } = get();
        return locationSystems.find((system) => system.id === selectedLocationSystemId);
      },
      getLocationSystemById: (id) => {
        const { locationSystems } = get();
        return locationSystems.find((system) => system.id === id);
      }
    }),
    {
      name: "bino-location-systems-storage",
      merge: (persistedState: any, currentState) => {
        const persistedSystems: LocationSystem[] = persistedState?.locationSystems || [];
        const mergedSystems = LocationSystems.map(defaultSys => {
          const persisted = persistedSystems.find(p => p.id === defaultSys.id);
          return persisted ? {
            ...defaultSys,
            ...persisted,
            mappingRules: persisted.mappingRules || defaultSys.mappingRules,
            gridConfig: persisted.gridConfig || defaultSys.gridConfig
          } : defaultSys;
        });

        persistedSystems.forEach(p => {
          if (!mergedSystems.find(m => m.id === p.id)) {
            mergedSystems.push(p);
          }
        });

        return {
          ...currentState,
          ...persistedState,
          locationSystems: mergedSystems
        };
      }
    }
  )
);
