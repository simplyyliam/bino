import type { Storage } from "@bino/types";
import { create } from "zustand";
import { api } from "../api";

type StorageState = {
  storages: Storage[]
  selectedStorageId: string | null
  isLoading: boolean

  // Actions
  fetchStorages: () => Promise<void>
  setSelectedStorageId: (id: string | null) => void
  addStorage: (storage: { buildingId: string; name: string; locationSystemId: string; maxLevel?: number; maxRow?: number; maxColumn?: number }) => Promise<Storage>
  updateStorage: (id: string, updateFields: Partial<Omit<Storage, "id">>) => Promise<void>
  deleteStorage: (id: string) => Promise<void>

  // Helpers
  getSelectedStorage: () => Storage | undefined
  getStoragesByBuilding: (buildingId: string) => Storage[]
}

export const useStorageStore = create<StorageState>()((set, get) => ({
  storages: [],
  selectedStorageId: null,
  isLoading: false,

  fetchStorages: async () => {
    set({ isLoading: true });
    try {
      const storages = await api.get<Storage[]>("/api/storages");
      set({ storages, isLoading: false });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  setSelectedStorageId: (id) => set({ selectedStorageId: id }),

  addStorage: async (newStorage) => {
    const storage = await api.post<Storage>("/api/storages", newStorage);
    set((state) => ({ storages: [...state.storages, storage] }));
    return storage;
  },

  updateStorage: async (id, updateFields) => {
    const storage = await api.patch<Storage>(`/api/storages/${id}`, updateFields);
    set((state) => ({
      storages: state.storages.map((s) => (s.id === id ? storage : s))
    }));
  },

  deleteStorage: async (id) => {
    await api.delete(`/api/storages/${id}`);
    set((state) => ({
      storages: state.storages.filter((storage) => storage.id !== id),
      selectedStorageId: state.selectedStorageId === id ? null : state.selectedStorageId
    }));
  },

  getSelectedStorage: () => {
    const { storages, selectedStorageId } = get()
    return storages.find((storage) => storage.id === selectedStorageId)
  },
  getStoragesByBuilding: (buildingId) => {
    const { storages } = get()
    return storages.filter((storage) => storage.buildingId === buildingId)
  }
}))
