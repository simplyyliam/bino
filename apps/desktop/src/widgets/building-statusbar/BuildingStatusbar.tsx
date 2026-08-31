import { Pill } from "@/shared/components"
import { useStorageStore, useBinStore } from "@bino/store";
import { useParams } from "react-router-dom";
import { getBinStats } from "@bino/data";

export const BuildingStatusbar = () => {
  const { buildingId } = useParams();
  const storages = useStorageStore((s) => s.storages)
  // Subscribe to bins for re-renders/udpates
  const bins = useBinStore((s) => s.bins);
  console.log("statusbar bins", bins)

  const storage = storages.find((storage) => storage.buildingId === buildingId)

  if(!storage) return null
  
  const {
    total,
    empty,
    stocked,
    outOfStock,
    outOfService,
  } = getBinStats(bins, storage.id);
  
  console.log({
    total,
    empty,
    stocked,
    outOfStock,
    outOfService,
  })
  
  return (
    <div className="flex items-center w-full p-2.5 gap-2.5">
      <Pill status label="BINS" value={total} />
      <Pill status label="EMPTY" value={empty} />
      <Pill status label="STOCKED" value={stocked} />
      <Pill status label="OUT OF STOCK" value={outOfStock} />
      <Pill status label="OUT OF SERVICE" value={outOfService} />
    </div>
  )
}
