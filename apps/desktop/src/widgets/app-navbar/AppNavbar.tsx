import { SearchField } from "@/features/app-navbar"


export const AppNavbar = () => {
  return (
    <div className="flex items-center justify-between w-full p-2.5 typeset typeset-docs">
      <h4>Bino Home</h4>
      <SearchField/>
    </div>
  )
}