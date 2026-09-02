import { useMemo } from "react";
import { Pill } from "@/shared/components"
import { useStorageStore, useBinStore, useItemStore } from "@bino/store";
import { useParams } from "react-router-dom";
import { getBinStats } from "@bino/data";
import { ActivityTimeline } from "../activity-timeline/ActivityTimeline";

export const BuildingStatusbar = () => {
  const { buildingId } = useParams();
  const storages = useStorageStore((s) => s.storages)
  // Subscribe to bins for re-renders/updates
  const bins = useBinStore((s) => s.bins);
  // Subscribe to binItems for status updates when ICNs are added
  const binItems = useItemStore((s) => s.binItems);

  const storage = storages.find((storage) => storage.buildingId === buildingId)

  // Pre-compute per-bin item count/quantity once per binItems change instead of
  // filtering the full binItems array for every bin in getBinStats.
  const binItemStatsById = useMemo(() => {
    const stats = new Map<string, { count: number; totalQuantity: number }>()
    for (const bi of binItems) {
      const existing = stats.get(bi.binId)
      if (existing) {
        existing.count += 1
        existing.totalQuantity += bi.quantity
      } else {
        stats.set(bi.binId, { count: 1, totalQuantity: bi.quantity })
      }
    }
    return stats
  }, [binItems])

  const stats = useMemo(() => {
    if (!storage) return null
    return getBinStats(
      bins,
      storage.id,
      (binId) => binItemStatsById.get(binId)?.count ?? 0,
      (binId) => binItemStatsById.get(binId)?.totalQuantity ?? 0
    )
  }, [bins, storage, binItemStatsById])

  if (!storage || !stats) return null

  const { total, empty, stocked, outOfStock, outOfService } = stats;


  return (
    <div className="flex items-center justify-between w-full p-2.5 gap-2.5">
      <div className="flex items-center gap-2.5">
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

      <ActivityTimeline />
    </div>
  )
}
