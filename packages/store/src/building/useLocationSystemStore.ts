import type { LocationSystem } from "@bino/types";
import { create } from "zustand";
import { api } from "../api";

type LocationSystemState = {
  locationSystems: LocationSystem[]
  selectedLocationSystemId: string | null
  isLoading: boolean

  // Actions
  fetchLocationSystems: () => Promise<void>
  setSelectedLocationSystemId: (id: string | null) => void
  setLocationSystems: (systems: LocationSystem[]) => void
  addLocationSystem: (system: Omit<LocationSystem, "id">) => Promise<LocationSystem>
  updateLocationSystem: (id: string, updateFields: Partial<Omit<LocationSystem, "id">>) => Promise<void>
  deleteLocationSystem: (id: string) => Promise<void>

  // Helpers
  getSelectedLocationSystem: () => LocationSystem | undefined
  getLocationSystemById: (id: string) => LocationSystem | undefined
}

export const useLocationSystemStore = create<LocationSystemState>()((set, get) => ({
  locationSystems: [],
  selectedLocationSystemId: null,
  isLoading: false,

  fetchLocationSystems: async () => {
    set({ isLoading: true });
    try {
      const locationSystems = await api.get<LocationSystem[]>("/api/location-systems");
      set({ locationSystems, isLoading: false });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  setSelectedLocationSystemId: (id) => set({ selectedLocationSystemId: id }),

  setLocationSystems: (systems) => set({ locationSystems: systems }),

  addLocationSystem: async (newSystem) => {
    const system = await api.post<LocationSystem>("/api/location-systems", newSystem);
    set((state) => ({ locationSystems: [...state.locationSystems, system] }));
    return system;
  },

  updateLocationSystem: async (id, updateFields) => {
    const system = await api.patch<LocationSystem>(`/api/location-systems/${id}`, updateFields);
    set((state) => ({
      locationSystems: state.locationSystems.map((s) => (s.id === id ? system : s))
    }));
  },

  deleteLocationSystem: async (id) => {
    await api.delete(`/api/location-systems/${id}`);
    set((state) => ({
      locationSystems: state.locationSystems.filter((system) => system.id !== id),
      selectedLocationSystemId: state.selectedLocationSystemId === id ? null : state.selectedLocationSystemId
    }));
  },

  getSelectedLocationSystem: () => {
    const { locationSystems, selectedLocationSystemId } = get();
    return locationSystems.find((system) => system.id === selectedLocationSystemId);
  },
  getLocationSystemById: (id) => {
    const { locationSystems } = get();
    return locationSystems.find((system) => system.id === id);
  }
}));
