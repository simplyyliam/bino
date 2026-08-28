import { Button } from "@bino/ui"
import { ArrowLeft } from "lucide-react"
import { ThemeToggle } from "../app-theme-toggle/ThemeToggle"
import { Pill } from "@/shared/components"
import { useNavigate, useParams } from "react-router-dom"
import { Buildings } from "@bino/data" // Import dataset from @bino/data

export const BuildingNavbar = () => {
  const { buildingId } = useParams()
  const navigate = useNavigate()

  // Find matching building by URL parameter
  const building = Buildings.find((b) => b.id === buildingId)

  // Use building name if found, fallback to parameter
  const storeName = building ? building.name : buildingId

  return (
    <div className="flex items-center justify-between w-full p-2.5 typeset typeset-docs">
      <div className="flex items-center gap-1.5">
        <Button variant="ghost" onClick={() => navigate('/home')}>
          <ArrowLeft />
        </Button>
        <Pill storeName={storeName} />
      </div>
      <ThemeToggle />
    </div>
  )
}
