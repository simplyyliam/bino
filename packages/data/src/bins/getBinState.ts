import type { Bin } from "@bino/types";

export type BinState =
  | "empty"
  | "stocked"
  | "outOfStock"
  | "outOfService";

export function getBinStats(bins: Bin[], storageId: string) {
  const storageBins = bins.filter(
    (bin) => bin.storageId === storageId
  );

  return {
    total: storageBins.length,

    empty: storageBins.filter(
      (bin) => !bin.itemId && !bin.isOutOfService
    ).length,

    stocked: storageBins.filter(
      (bin) =>
        !!bin.itemId &&
        bin.quantity > 0 &&
        !bin.isOutOfService
    ).length,

    outOfStock: storageBins.filter(
      (bin) =>
        !!bin.itemId &&
        bin.quantity === 0 &&
        !bin.isOutOfService
    ).length,

    outOfService: storageBins.filter(
      (bin) => bin.isOutOfService
    ).length,
  };
}



export function getBinState(bin: Bin): BinState {
  if (bin.isOutOfService) return "outOfService";
  if (!bin.itemId) return "empty";
  if (bin.quantity === 0) return "outOfStock";
  return "stocked";
}
