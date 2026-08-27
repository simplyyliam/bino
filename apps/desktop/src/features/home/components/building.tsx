import { Badge } from "@bino/ui"

type BuildingProps = {
  building: string
  buildingNum: string

}

export const BuildingCard = ({ building, buildingNum }: BuildingProps) => {
  return (
    <div className="flex flex-col items-start justify-between p-2.5 w-full h-90 bg-accent rounded-lg mb-1.5 break-inside-avoid">
      <h5>{building}</h5>
      <div className="flex items-center gap-1.5">
        <Badge variant="outline">BINS 162</Badge>
        <Badge variant="outline">Building {buildingNum}</Badge>
      </div>
    </div>
  )
}
