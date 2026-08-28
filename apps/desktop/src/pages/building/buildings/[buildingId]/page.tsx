import { useParams } from "react-router-dom"

export default function Building() {
  const { buildingId } = useParams()
  return (
    <div className="flex items-center justify-center w-full h-full typeset typeset-docs">
      <h3>Hello Building {buildingId}</h3>
    </div>
  )
}
