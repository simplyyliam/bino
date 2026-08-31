// @bino/data or wherever you keep domain helpers

import type { Bin } from "@bino/types";

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