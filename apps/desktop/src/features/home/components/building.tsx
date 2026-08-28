import { Badge } from "@bino/ui"
import { useNavigate } from "react-router-dom"

type BuildingProps = {
  building: string
  buildingNum: string
  buildingId: string

}

export const BuildingCard = ({ building, buildingNum, buildingId }: BuildingProps) => {
  const navigate = useNavigate()
  return (
    <button onClick={() => navigate(`/buildings/${buildingId}`)}  className="flex flex-col items-start justify-between p-2.5 w-full h-90 bg-accent rounded-lg mb-1.5 break-inside-avoid">
      <h5>{building}</h5>
      <div className="flex items-center gap-1.5">
        <Badge variant="outline">BINS 162</Badge>
        <Badge variant="outline">Building {buildingNum}</Badge>
      </div>
    </button>
  )
}
