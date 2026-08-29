import { SearchField } from "@/features/app-navbar"
import { ThemeToggle } from "../app-theme-toggle/ThemeToggle"


export const AppMenubar = () => {
  return (
    <div className="flex items-center justify-between w-full p-2.5 typeset typeset-docs">
      <h4>Bino Home</h4>
      <div className="flex items-center gap-1.5">
        <SearchField />
        <ThemeToggle/>
      </div>
    </div>
  )
}