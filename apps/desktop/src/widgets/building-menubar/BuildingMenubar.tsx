import { Button } from "@bino/ui"
import { ArrowLeft } from "lucide-react"
import { ThemeToggle } from "../app-theme-toggle/ThemeToggle"
import { MenubarGroup, Pill } from "@/shared/components"
import { useNavigate, useParams } from "react-router-dom"
import { ConfigMenu } from "@/features/building-navbar/components"
import { useState } from "react"
import { SearchField } from "@/features/app-navbar"
import { useBuildingStore } from "@bino/store"

export const BuildingMenu = () => {
  const [open, setOpen] = useState(false)
  const { buildingId } = useParams()
  const buildings = useBuildingStore((state) => state.buildings);
  const navigate = useNavigate()

  const currentBuilding = buildings.find((b) => b.id === buildingId);
  
  return (
    <div className="flex items-center justify-between w-full p-2.5 typeset typeset-docs">
      <MenubarGroup>
        <Button variant="ghost" onClick={() => navigate('/home')}>
          <ArrowLeft />
        </Button>
        <Pill label={currentBuilding?.name ?? buildingId ?? "Unknown"} />
      </MenubarGroup>
      <MenubarGroup>
        <SearchField />
        <ThemeToggle />
        <ConfigMenu open={open} onOpenChange={setOpen} />
      </MenubarGroup>
    </div>
  )
}
