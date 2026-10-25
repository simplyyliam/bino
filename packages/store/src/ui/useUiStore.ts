import { create } from "zustand";

const KEY = "bino-sidebar";

const readSidebar = () => {
  try {
    return localStorage.getItem(KEY) !== "closed";
  } catch {
    return true;
  }
};

type UiState = {
  sidebarOpen: boolean;
  shortcutsOpen: boolean;
  toggleSidebar: () => void;
  setShortcutsOpen: (open: boolean) => void;
};

// Per-viewer UI preferences. Nothing here is inventory data.
export const useUiStore = create<UiState>((set, get) => ({
  sidebarOpen: readSidebar(),
  shortcutsOpen: false,
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
}));
