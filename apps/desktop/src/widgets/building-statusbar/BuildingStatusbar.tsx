import { Pill } from "@/shared/components"
import { useStorageStore, useBinStore, useItemStore } from "@bino/store";
import { useParams } from "react-router-dom";
import { getBinStats } from "@bino/data";

export const BuildingStatusbar = () => {
  const { buildingId } = useParams();
  const storages = useStorageStore((s) => s.storages)
  // Subscribe to bins for re-renders/updates
  const bins = useBinStore((s) => s.bins);
  // Subscribe to binItems for status updates when ICNs are added
  const binItems = useItemStore((s) => s.binItems);
  console.log("statusbar bins", bins)

  const storage = storages.find((storage) => storage.buildingId === buildingId)

  if (!storage) return null

  const getBinItemCount = (binId: string) => {
    return binItems.filter(bi => bi.binId === binId).length;
  };

  const getTotalBinItemQuantity = (binId: string) => {
    return binItems
      .filter(bi => bi.binId === binId)
      .reduce((sum, bi) => sum + bi.quantity, 0);
  };

  const {
    total,
    empty,
    stocked,
    outOfStock,
    outOfService,
  } = getBinStats(bins, storage.id, getBinItemCount, getTotalBinItemQuantity);


  return (
    <div className="flex items-center w-full p-2.5 gap-2.5">
      <Pill
        status
        label="BINS"
        value={total}
        className="
          bg-[#F1F1F1]/15!
          border-[#949494]!
          border-[1.4px]
        "
      />
      <Pill
        status
        label="EMPTY"
        value={empty}
        className="
          bg-[#F1F1F1]/15!
          border-[#949494]!
          border-[1.4px]
        "
      />

      <Pill
        status
        label="STOCKED"
        value={stocked}
        className="
          bg-bin-stocked/15!
          border-bin-stocked!
          border-[1.4px]
          **:data-[slot=pill-label]:text-bin-stocked!
          **:data-[slot=pill-value]:text-bin-stocked!
        "
      />

      <Pill
        status
        label="OUT OF STOCK"
        value={outOfStock}
        className="
          bg-bin-out-of-stock/15!
          border-bin-out-of-stock!
          border-[1.4px]
          **:data-[slot=pill-label]:text-bin-out-of-stock!
          **:data-[slot=pill-value]:text-bin-out-of-stock!
        "
      />

      <Pill
        status
        label="OUT OF SERVICE"
        value={outOfService}
        className="
          bg-bin-out-of-service/15!
          border-bin-out-of-service!
          border-[1.4px]
          **:data-[slot=pill-label]:text-bin-out-of-service!
          **:data-[slot=pill-value]:text-bin-out-of-service!
        "
      />
    </div>
  )
}
