import { useMemo } from "react";
import type { Bin, BinItem, Building, Item, Storage } from "@bino/types";
import { useBinStore, useBuildingStore, useItemStore, useStorageStore } from "@bino/store";

export type BinStatus = "empty" | "stocked" | "low" | "out" | "service";

export const BIN_STATUSES: { value: BinStatus; label: string; hint: string }[] = [
  { value: "stocked", label: "Stocked", hint: "Has items" },
  { value: "low", label: "Low", hint: "At or below its low-stock alert" },
  { value: "out", label: "Out of stock", hint: "Everything in it is at 0" },
  { value: "empty", label: "Empty", hint: "Nothing assigned yet" },
  { value: "service", label: "Out of service", hint: "Not in use right now" },
];

export const statusLabel = (status: BinStatus) =>
  BIN_STATUSES.find((s) => s.value === status)?.label ?? status;

export const isLow = (bi: Pick<BinItem, "quantity" | "minQuantity">) =>
  bi.minQuantity != null && bi.quantity > 0 && bi.quantity <= bi.minQuantity;

export function getBinStatus(bin: Bin, binItems: BinItem[]): BinStatus {
  if (bin.isOutOfService) return "service";
  if (binItems.length === 0) return "empty";
  const total = binItems.reduce((sum, bi) => sum + bi.quantity, 0);
  if (total === 0) return "out";
  // One empty or low line in an otherwise full bin still needs a look.
  if (binItems.some((bi) => bi.quantity === 0 || isLow(bi))) return "low";
  return "stocked";
}

export const binTitle = (bin: Pick<Bin, "name" | "locationCode">) => bin.name || bin.locationCode;

export type BinSummary = {
  bin: Bin;
  items: BinItem[];
  total: number;
  status: BinStatus;
};

// Everything the screens need, indexed once per store change instead of
// filtering big arrays inside every grid cell.
export function useInventory() {
  const buildings = useBuildingStore((s) => s.buildings);
  const storages = useStorageStore((s) => s.storages);
  const bins = useBinStore((s) => s.bins);
  const items = useItemStore((s) => s.items);
  const icns = useItemStore((s) => s.icns);
  const binItems = useItemStore((s) => s.binItems);

  return useMemo(() => {
    const itemsById = new Map<string, Item>(items.map((i) => [i.id, i]));
    const icnsById = new Map(icns.map((i) => [i.id, i]));
    const buildingsById = new Map<string, Building>(buildings.map((b) => [b.id, b]));
    const storagesById = new Map<string, Storage>(storages.map((s) => [s.id, s]));

    const itemsByBin = new Map<string, BinItem[]>();
    for (const bi of binItems) {
      const list = itemsByBin.get(bi.binId);
      if (list) list.push(bi);
      else itemsByBin.set(bi.binId, [bi]);
    }

    const summaries = new Map<string, BinSummary>();
    const binsByStorage = new Map<string, Bin[]>();
    for (const bin of bins) {
      const list = itemsByBin.get(bin.id) ?? [];
      summaries.set(bin.id, {
        bin,
        items: list,
        total: list.reduce((sum, bi) => sum + bi.quantity, 0),
        status: getBinStatus(bin, list),
      });
      const storageBins = binsByStorage.get(bin.storageId);
      if (storageBins) storageBins.push(bin);
      else binsByStorage.set(bin.storageId, [bin]);
    }

    // The app treats each building as having one storage (its bin grid).
    const storageByBuilding = new Map<string, Storage>();
    for (const storage of storages) {
      if (!storageByBuilding.has(storage.buildingId)) storageByBuilding.set(storage.buildingId, storage);
    }

    const buildingForBin = (binId: string) => {
      const bin = summaries.get(binId)?.bin;
      const storage = bin ? storagesById.get(bin.storageId) : undefined;
      return storage ? buildingsById.get(storage.buildingId) : undefined;
    };

    return {
      buildings,
      storages,
      bins,
      items,
      icns,
      binItems,
      itemsById,
      icnsById,
      buildingsById,
      storagesById,
      summaries,
      binsByStorage,
      storageByBuilding,
      buildingForBin,
    };
  }, [buildings, storages, bins, items, icns, binItems]);
}

export type Inventory = ReturnType<typeof useInventory>;

export function countStatuses(summaries: BinSummary[]) {
  const counts: Record<BinStatus, number> = { empty: 0, stocked: 0, low: 0, out: 0, service: 0 };
  for (const s of summaries) counts[s.status] += 1;
  return counts;
}

export const binLink = (buildingId: string, binId: string) => `/buildings/${buildingId}?bin=${binId}`;
