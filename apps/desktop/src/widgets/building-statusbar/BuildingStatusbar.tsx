import { Pill } from "@/shared/components"
import { useStorageStore, useBinStore } from "@bino/store";
import { useParams } from "react-router-dom";


export const BuildingStatusbar = () => {
  const { buildingId } = useParams();
  const storages = useStorageStore((s) => s.storages)
  const bins = useBinStore((s) => s.bins)
  const createBinInStorage = useBinStore((s) => s.createBinInStorage)
  const removeLastBinFromStorage = useBinStore((s) => s.removeLastBinFromStorage)
  
  return (
    <div className="flex items-center w-full p-2.5 gap-2.5">
      <Pill status label="BINS" value="10" />
      <Pill status label="EMPTY" value="10" />
      <Pill status label="STOCKED" value="10" />
      <Pill status label="OUT OF SERVICE" value="10" />
    </div>
  )
}
