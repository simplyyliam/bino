import { Badge, ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@bino/ui"
import { useNavigate } from "react-router-dom"
import type { Building } from "@bino/types"
import { useBuildingStore } from "@bino/store"

type BuildingProps = {
  building: Building

}

export const BuildingCard = ({ building }: BuildingProps) => {
  const navigate = useNavigate()
  const deleteBuilding = useBuildingStore((s) => s.deleteBuilding)
  return (
    <ContextMenu>
      <ContextMenuTrigger render={
        <button onClick={() => navigate(`/buildings/${building.id}`)} className="flex flex-col items-start justify-between p-2.5 w-full h-90 bg-accent rounded-lg mb-1.5 break-inside-avoid">
          <h5>{building.name}</h5>
          <div className="flex items-center gap-1.5">
            <Badge variant="outline">BINS 162</Badge>
            <Badge variant="outline">Building {building.buildingNumber}</Badge>
          </div>
        </button>
      } />
      <ContextMenuContent>
        <ContextMenuItem variant="destructive" onClick={() => deleteBuilding(building.id)}>Delete</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}

