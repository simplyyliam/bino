import { create } from "zustand";

// Open state for the global search (⌘K), so any screen can open it.
type SearchState = {
  open: boolean;
  setOpen: (open: boolean) => void;
};

export const useSearchStore = create<SearchState>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
}));
