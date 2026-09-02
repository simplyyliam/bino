import { ArrowLeft } from "lucide-react"
import { IconButton, MenubarGroup, Pill } from "@/shared/components"
import { useNavigate, useParams } from "react-router-dom"
import { ConfigMenu } from "@/features/building-navbar/components"
import { useState } from "react"
import { SearchField } from "@/features/app-navbar"
import { useBuildingStore } from "@bino/store"
import { Clock03Icon } from "@hugeicons/core-free-icons"

export const BuildingMenu = () => {
  const [open, setOpen] = useState(false)
  const { buildingId } = useParams()
  const buildings = useBuildingStore((state) => state.buildings);
  const navigate = useNavigate()

  const currentBuilding = buildings.find((b) => b.id === buildingId);

  return (
    <div className="flex items-center justify-between w-full p-2.5">
      <MenubarGroup>
        <IconButton Icon={ArrowLeft} onClick={() => navigate('/')} />
        <Pill label={currentBuilding?.name ?? buildingId ?? "Unknown"} />
      </MenubarGroup>
      <MenubarGroup>
        <SearchField />
        <IconButton Label="Timeline" Icon={Clock03Icon} onClick={() => navigate(`/building-timeline/${buildingId}`)} />
        <ConfigMenu open={open} onOpenChange={setOpen} />
      </MenubarGroup>
    </div>
  )
}
