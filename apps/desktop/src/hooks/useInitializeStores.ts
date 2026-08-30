import { useEffect } from "react"
import { useBuildingStore, useStorageStore, useBinStore, useLocationSystemStore } from "@bino/store"
import { Buildings, Storages, Bins, LocationSystems } from "@bino/data"

/**
 * Hook to initialize stores with mock data on app mount.
 * This simulates what would normally come from a backend/database.
 */
export function useInitializeStores() {
  useEffect(() => {
    // Initialize location systems first (no dependencies)
    useLocationSystemStore.getState().setLocationSystems(LocationSystems)

    // Initialize buildings (no dependencies)
    useBuildingStore.getState().setBuildings(Buildings)

    // Initialize storages (depends on buildings and location systems)
    useStorageStore.getState().setStorages(Storages)

    // Initialize bins (depends on storages)
    useBinStore.getState().setBins(Bins)

    console.log("✓ Stores initialized with mock data")
  }, [])
}
