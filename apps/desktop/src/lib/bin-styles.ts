import type { BinStatus } from "./inventory";

// Tile fills per status. Shared by the bin grid and the overview thumbnails.
export const statusSwatch: Record<BinStatus, string> = {
  empty: "border border-dashed border-bin-empty bg-transparent",
  stocked: "bg-bin-stocked",
  low: "bg-bin-low",
  out: "bg-bin-out",
  service: "bg-bin-service bg-hatch text-bin-service-fg",
};
