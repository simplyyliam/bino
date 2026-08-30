import type { Storage } from "@bino/types";
import { create } from "zustand";
import { persist } from "zustand/middleware";

type StorageState = {
  storages: Storage[]
  selectedStorageId: string | null

  // Actions
  setStorages: (storages: Storage[]) => void
  setSelectedStorageId: (id: string | null) => void
  addStorage: (storage: Storage) => void
  updateStorage: (id: string, updateFields: Partial<Omit<Storage, "id">>) => void
  deleteStorage: (id: string) => void

  // Helpers
  getSelectedStorage: () => Storage | undefined
  getStoragesByBuilding: (buildingId: string) => Storage[]
}

export const useStorageStore = create<StorageState>()(
  persist(
    (set, get) => ({
      storages: [],
      selectedStorageId: null,

      setStorages: (storages) => set({ storages }),
      setSelectedStorageId: (id) => set({ selectedStorageId: id }),
      addStorage: (newStorage) =>
        set((state) => ({
          storages: [...state.storages, newStorage]
        })),
      updateStorage: (id, updateFields) =>
        set((state) => ({
          storages: state.storages.map((storage) => storage.id === id ? { ...storage, ...updateFields } : storage)
        })),
      deleteStorage: (id) =>
        set((state) => ({
          storages: state.storages.filter((storage) => storage.id !== id),
          selectedStorageId: state.selectedStorageId === id ? null : state.selectedStorageId
        })),
      getSelectedStorage: () => {
        const { storages, selectedStorageId } = get()
        return storages.find((storage) => storage.id === selectedStorageId)
      },
      getStoragesByBuilding: (buildingId) => {
        const { storages } = get()
        return storages.filter((storage) => storage.buildingId === buildingId)
      }
    }),
    {
      name: "bino-storages-storage"
    }
  )
)
