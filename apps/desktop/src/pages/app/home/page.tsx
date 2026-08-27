import { BuildingCard } from "@/features/home";
import { Buildings } from "@bino/data"

export default function Home() {
  return (
    <div className="flex items-center justify-center w-full h-full typeset typeset-docs">
      <div className="flex flex-col">
        <div>
          <h3>Hello John</h3>
          <h3><span className="text-primary/35">There are</span> 3 storage buildings, <span className="text-primary/35">with</span> 486 bins <span className="text-primary/35">in total.</span></h3>
        </div>
        <div className="columns-2 gap-1.5 typeset typeset-docs">
          {Buildings.map((building) => (
            <BuildingCard key={building.id} building={building.name} buildingNum={building.buildingNumber} />
          ))}
        </div>
      </div>
    </div>
  )
}
