import { Pill } from "@/shared/components"


export const BuildingStatusbar = () => {
  return (
    <div className="flex items-center w-full p-2.5 gap-2.5">
      <Pill status label="BINS" value="10"/>
      <Pill status label="EMPTY" value="10"/>
      <Pill status label="STOCKED" value="10"/>
      <Pill status label="OUT OF SERVICE" value="10"/>
    </div>
  )
}