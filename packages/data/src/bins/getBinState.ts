import type { Bin } from "@bino/types";

export type BinState =
  | "empty"
  | "stocked"
  | "outOfStock"
  | "outOfService";

export function getBinStats(bins: Bin[], storageId: string, getBinItemCount?: (binId: string) => number, getTotalBinItemQuantity?: (binId: string) => number) {
  const storageBins = bins.filter(
    (bin) => bin.storageId === storageId
  );

  return {
    total: storageBins.length,

    empty: storageBins.filter((bin) => {
      if (bin.isOutOfService) return false;
      const binItemCount = getBinItemCount?.(bin.id) ?? 0;
      return !bin.itemId && binItemCount === 0;
    }).length,

    stocked: storageBins.filter((bin) => {
      if (bin.isOutOfService) return false;
      const binItemCount = getBinItemCount?.(bin.id) ?? 0;
      const totalQuantity = getTotalBinItemQuantity?.(bin.id) ?? bin.quantity;
      return (!!bin.itemId || binItemCount > 0) && totalQuantity > 0;
    }).length,

    outOfStock: storageBins.filter((bin) => {
      if (bin.isOutOfService) return false;
      const binItemCount = getBinItemCount?.(bin.id) ?? 0;
      const totalQuantity = getTotalBinItemQuantity?.(bin.id) ?? bin.quantity;
      return (!!bin.itemId || binItemCount > 0) && totalQuantity === 0;
    }).length,

    outOfService: storageBins.filter(
      (bin) => bin.isOutOfService
    ).length,
  };
}



export function getBinState(bin: Bin, binItemCount?: number, totalBinItemQuantity?: number): BinState {
  if (bin.isOutOfService) return "outOfService";

  // Check both legacy itemId and new binItem count
  const hasItems = bin.itemId || (binItemCount !== undefined && binItemCount > 0);

  if (!hasItems) return "empty";

  // Check quantities: use binItem total quantity if available, otherwise fall back to bin.quantity
  const quantity = totalBinItemQuantity !== undefined ? totalBinItemQuantity : bin.quantity;

  if (quantity === 0) return "outOfStock";
  return "stocked";
}
