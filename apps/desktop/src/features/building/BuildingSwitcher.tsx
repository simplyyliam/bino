import { useNavigate } from "react-router-dom";
import { CheckIcon, ChevronsUpDownIcon } from "lucide-react";
import type { Building } from "@bino/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@bino/ui";
import { BuildingGlyph } from "@/components/BuildingGlyph";

export function BuildingSwitcher({ current, buildings }: { current: Building; buildings: Building[] }) {
  const navigate = useNavigate();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            className="-mx-1.5 flex items-center gap-2 rounded-md px-1.5 py-0.5 font-medium text-foreground outline-none transition-colors duration-100 hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring aria-expanded:bg-accent"
          >
            <BuildingGlyph id={current.id} name={current.name} className="size-4 rounded text-[9px]" />
            {current.name}
            <ChevronsUpDownIcon className="size-3.5 text-muted-foreground" />
          </button>
        }
      />
      <DropdownMenuContent align="start" className="w-60">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Switch building</DropdownMenuLabel>
          {buildings.map((b) => (
            <DropdownMenuItem key={b.id} onClick={() => navigate(`/buildings/${b.id}`)}>
              <BuildingGlyph id={b.id} name={b.name} className="size-4 rounded text-[9px]" />
              <span className="truncate">{b.name}</span>
              {b.id === current.id && <CheckIcon className="ml-auto" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
