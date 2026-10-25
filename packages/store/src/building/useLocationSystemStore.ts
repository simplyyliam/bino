import type { LocationSystem } from "@bino/types";
import { create } from "zustand";
import { api } from "../api";

type LocationSystemState = {
  locationSystems: LocationSystem[]
  isLoading: boolean

  fetchLocationSystems: () => Promise<void>
  addLocationSystem: (system: Omit<LocationSystem, "id">) => Promise<LocationSystem>
  updateLocationSystem: (id: string, updateFields: Partial<Omit<LocationSystem, "id">>) => Promise<void>
}

export const useLocationSystemStore = create<LocationSystemState>()((set) => ({
  locationSystems: [],
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

  addLocationSystem: async (newSystem) => {
    const system = await api.post<LocationSystem>("/api/location-systems", newSystem);
    set((state) => ({ locationSystems: [...state.locationSystems, system] }));
    return system;
  },

  updateLocationSystem: async (id, updateFields) => {
    const { updatedBinCount: _count, ...system } = await api.patch<LocationSystem & { updatedBinCount?: number }>(
      `/api/location-systems/${id}`,
      updateFields
    );
    set((state) => ({
      locationSystems: state.locationSystems.map((s) => (s.id === id ? system : s))
    }));
  },
}));
