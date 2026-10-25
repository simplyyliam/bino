import { useNavigate } from "react-router-dom";
import { CheckIcon, ChevronsUpDownIcon } from "lucide-react";
import type { Building } from "@bino/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@bino/ui";

export function BuildingSwitcher({ current, buildings }: { current: Building; buildings: Building[] }) {
  const navigate = useNavigate();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            className="-ml-2 flex items-center gap-1.5 rounded-lg px-2 py-1 text-2xl font-semibold tracking-tight outline-none transition-colors duration-150 hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring aria-expanded:bg-accent"
          >
            {current.name}
            <ChevronsUpDownIcon className="size-4 text-muted-foreground" />
          </button>
        }
      />
      <DropdownMenuContent align="start" className="w-60">
        <DropdownMenuLabel>Switch building</DropdownMenuLabel>
        {buildings.map((b) => (
          <DropdownMenuItem key={b.id} onClick={() => navigate(`/buildings/${b.id}`)}>
            <span className="truncate">{b.name}</span>
            {b.id === current.id && <CheckIcon className="ml-auto" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
