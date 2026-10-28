import { create } from "zustand";

const KEY = "bino-sidebar";
const BUILDING_KEY = "bino-last-building";

const readSidebar = () => {
  try {
    return localStorage.getItem(KEY) !== "closed";
  } catch {
    return true;
  }
};

const readLastBuilding = () => {
  try {
    return localStorage.getItem(BUILDING_KEY);
  } catch {
    return null;
  }
};

type UiState = {
  sidebarOpen: boolean;
  // The building last opened, so the sidebar switcher has something to show on other pages.
  lastBuildingId: string | null;
  shortcutsOpen: boolean;
  toggleSidebar: () => void;
  setShortcutsOpen: (open: boolean) => void;
  setLastBuilding: (id: string) => void;
};

// Per-viewer UI preferences. Nothing here is inventory data.
export const useUiStore = create<UiState>((set, get) => ({
  sidebarOpen: readSidebar(),
  shortcutsOpen: false,
  lastBuildingId: readLastBuilding(),
  toggleSidebar: () => {
    const next = !get().sidebarOpen;
    try {
      localStorage.setItem(KEY, next ? "open" : "closed");
    } catch {
      // Fine, it just won't be remembered.
    }
    set({ sidebarOpen: next });
  },
  setShortcutsOpen: (shortcutsOpen) => set({ shortcutsOpen }),
  setLastBuilding: (lastBuildingId) => {
    if (get().lastBuildingId === lastBuildingId) return;
    try {
      localStorage.setItem(BUILDING_KEY, lastBuildingId);
    } catch {
      // Fine, it just won't be remembered.
    }
    set({ lastBuildingId });
  },
}));
