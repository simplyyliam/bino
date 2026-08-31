import { Pill } from "@/shared/components"
import { useStorageStore, useBinStore } from "@bino/store";
import { useParams } from "react-router-dom";


export const BuildingStatusbar = () => {
  const { buildingId } = useParams();
  const storages = useStorageStore((s) => s.storages)
  const getTotalBins = useBinStore((s) => s.getTotalBins)
  const getEmptyBins = useBinStore((s) => s.getEmptyBins)
  const getStockedBins = useBinStore((s) => s.getStockedBins)
  const getOutOfStockBins = useBinStore((s) => s.getOutOfStockBins)
  const getOutOfServiceBins = useBinStore((s) => s.getOutOfServiceBins)

  const storage = storages.find((storage) => storage.buildingId === buildingId)
  
  const total = getTotalBins(storage.id)
  const empty = getEmptyBins(storage.id).length 
  const stocked = getStockedBins(storage.id).length
  const outOfStock = getOutOfStockBins(storage.id).length
  const outOfService = getOutOfServiceBins(storage.id).length
  
  
  
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
