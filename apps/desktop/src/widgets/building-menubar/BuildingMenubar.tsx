import { Button } from "@bino/ui"
import { ArrowLeft } from "lucide-react"
import { ThemeToggle } from "../app-theme-toggle/ThemeToggle"
import { MenubarGroup, Pill } from "@/shared/components"
import { useNavigate, useParams } from "react-router-dom"
import { Buildings } from "@bino/data" // Import dataset from @bino/data
import { ConfigMenu } from "@/features/building-navbar/components"
import { useState } from "react"
import { SearchField } from "@/features/app-navbar"

export const BuildingMenu = () => {
  const [open, setOpen] = useState(false)
  const { buildingId } = useParams()
  const navigate = useNavigate()

  // Find matching building by URL parameter
  const building = Buildings.find((b) => b.id === buildingId)

  // Use building name if found, fallback to parameter
  const storeName = building ? building.name : buildingId

  return (
    <div className="flex items-center justify-between w-full p-2.5 typeset typeset-docs">
      <MenubarGroup>
        <Button variant="ghost" onClick={() => navigate('/home')}>
          <ArrowLeft />
        </Button>
        <Pill label={storeName} />
      </MenubarGroup>
      <MenubarGroup>
        <SearchField/>
        <ThemeToggle />
        <ConfigMenu open={open} onOpenChange={setOpen} />
      </MenubarGroup>
    </div>
  )
}
