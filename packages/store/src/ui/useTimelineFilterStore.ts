import { create } from "zustand";

interface TimelineFilterStore {
  selectedBuildingId: string | null;
  setSelectedBuildingId: (id: string | null) => void;
}

export const useTimelineFilterStore = create<TimelineFilterStore>((set) => ({
  selectedBuildingId: null,
  setSelectedBuildingId: (id) => set({ selectedBuildingId: id }),
}));
