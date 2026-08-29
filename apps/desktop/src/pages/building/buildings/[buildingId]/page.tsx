import { Bins, Storages } from "@bino/data"
import { useParams } from "react-router-dom"

export default function Building() {
  const { buildingId } = useParams()
  const storageId = Storages.find((storage) => storage.buildingId === buildingId)
  const bins = Bins.filter((bin) => bin.storageId === storageId?.id)
  
  const racksPerColumn = 5;
  
  return (
    <div className="flex items-center justify-center w-full h-full typeset typeset-docs">
      <div className="grid grid-flow-col auto-cols-max gap-2" style={{
        gridTemplateRows: `repeat(${racksPerColumn}, auto)`
      }}>
        {bins.map((bin) => (
          <div key={bin.id} className="flex items-center justify-center w-17.5 h-17.5 bg-bin-empty rounded-[20px]">
            <h5>{bin.locationCode}</h5>
          </div>
        ))}
      </div>
    </div>
  )
}
