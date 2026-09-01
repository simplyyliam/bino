import { SearchField } from "@/features/app-navbar"
import { ThemeToggle } from "../app-theme-toggle/ThemeToggle"
import { Button } from "@bino/ui"
import { Clock03Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useNavigate } from "react-router-dom"


export const AppMenubar = () => {
  const navigate = useNavigate()

  return (
    <div className="flex items-center justify-between w-full p-2.5">
      <h4>Bino Home</h4>
      <div className="flex items-center gap-1.5">
        <SearchField />
        <Button variant="ghost" size="sm" onClick={() => navigate('/timeline')}>
          <HugeiconsIcon icon={Clock03Icon} size={18} strokeWidth={1.67} />
          Timeline
        </Button>
        <ThemeToggle/>
      </div>
    </div>
  )
}