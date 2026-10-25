import type { Storage } from "@bino/types";
import { create } from "zustand";
import { api } from "../api";

type NewStorage = {
  buildingId: string
  name: string
  locationSystemId: string
  // Leave out (or null) and the API picks the next free store number.
  storeNumber?: number | null
}

type StorageState = {
  storages: Storage[]
  isLoading: boolean

  fetchStorages: () => Promise<void>
  addStorage: (storage: NewStorage) => Promise<Storage>
  updateStorage: (id: string, updateFields: Partial<Omit<Storage, "id">>) => Promise<void>
}

export const useStorageStore = create<StorageState>()((set) => ({
  storages: [],
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

  addStorage: async (newStorage) => {
    const storage = await api.post<Storage>("/api/storages", newStorage);
    set((state) => ({ storages: [...state.storages, storage] }));
    return storage;
  },

  updateStorage: async (id, updateFields) => {
    // The API may tack on updatedBinCount; it isn't part of the storage itself.
    const { updatedBinCount: _count, ...storage } = await api.patch<Storage & { updatedBinCount?: number }>(
      `/api/storages/${id}`,
      updateFields
    );
    set((state) => ({
      storages: state.storages.map((s) => (s.id === id ? storage : s))
    }));
  },
}))
