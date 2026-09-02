import { useEffect } from "react";
import { RouterProvider } from "react-router-dom";
import { Router } from "./Router";
import { ThemeProvider } from "./theme/theme-provider";
import { TooltipProvider } from "@bino/ui";
import {
  useBuildingStore,
  useStorageStore,
  useBinStore,
  useItemStore,
  useLocationSystemStore,
  useMovementHistoryStore,
} from "@bino/store";

export default function App() {
  useEffect(() => {
    // Initial load from the API - each store fetches its own slice.
    Promise.all([
      useLocationSystemStore.getState().fetchLocationSystems(),
      useBuildingStore.getState().fetchBuildings(),
      useStorageStore.getState().fetchStorages(),
      useBinStore.getState().fetchBins(),
      useItemStore.getState().fetchItems(),
      useItemStore.getState().fetchICNs(),
      useItemStore.getState().fetchBinItems(),
      useMovementHistoryStore.getState().fetchHistory(),
    ]).catch((err) => {
      console.error("Failed to load initial data from API", err);
    });
  }, []);

  return (
    <ThemeProvider>
      <div className="typeset typeset-docs">
        <TooltipProvider>
          <RouterProvider router={Router} />
        </TooltipProvider>
      </div>
    </ThemeProvider>
  )
}
