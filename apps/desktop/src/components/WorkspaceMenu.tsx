import { useLocation, useNavigate } from "react-router-dom";
import { CheckIcon, ChevronsUpDownIcon, KeyboardIcon, MonitorIcon, MoonIcon, PaletteIcon, PlusIcon, SunIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  Kbd,
} from "@bino/ui";
import { useUiStore } from "@bino/store";
import { useInventory } from "@/lib/inventory";
import { useTheme, type Theme } from "@/theme/theme-provider";
import { BuildingGlyph } from "./BuildingGlyph";

const themes: { label: string; value: Theme; icon: typeof SunIcon }[] = [
  { label: "Light", value: "light", icon: SunIcon },
  { label: "Dark", value: "dark", icon: MoonIcon },
  { label: "Match System", value: "system", icon: MonitorIcon },
];

// The building switcher at the top of the sidebar, plus app-wide settings.
export function WorkspaceMenu({ onNewBuilding }: { onNewBuilding: () => void }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { theme, setTheme } = useTheme();
  const setShortcutsOpen = useUiStore((s) => s.setShortcutsOpen);
  const lastBuildingId = useUiStore((s) => s.lastBuildingId);
  const { buildings, buildingsById } = useInventory();

  // The open building wins, then the last one opened, then the first.
  const routeId = pathname.match(/^\/buildings\/([^/]+)/)?.[1];
  const current =
    (routeId && buildingsById.get(routeId)) || (lastBuildingId && buildingsById.get(lastBuildingId)) || buildings[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            className="-ml-1 flex h-8 min-w-0 items-center gap-2.5 rounded-lg px-1.5 outline-none transition-colors duration-100 hover:bg-sidebar-accent/60 focus-visible:ring-3 focus-visible:ring-ring aria-expanded:bg-sidebar-accent/60"
            aria-label={current ? `Building: ${current.name}` : "Buildings"}
          >
            {current && <BuildingGlyph id={current.id} name={current.name} className="size-5 rounded-md text-[11px]" />}
            <span className="truncate text-[15px] font-medium tracking-[-0.01em]">{current ? current.name : "No buildings"}</span>
            <ChevronsUpDownIcon className="size-3.5 shrink-0 text-muted-foreground" strokeWidth={2} />
          </button>
        }
      />
      <DropdownMenuContent align="start" className="w-60">
        {buildings.length > 0 && (
          <>
            <DropdownMenuGroup>
              <DropdownMenuLabel>Buildings</DropdownMenuLabel>
              {buildings.map((b) => (
                <DropdownMenuItem key={b.id} onClick={() => navigate(`/buildings/${b.id}`)}>
                  <BuildingGlyph id={b.id} name={b.name} className="size-4 rounded text-[9px]" />
                  <span className="truncate">{b.name}</span>
                  {b.id === current?.id && <CheckIcon className="ml-auto" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem onClick={onNewBuilding}>
          <PlusIcon />
          New Building
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <PaletteIcon />
            Appearance
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-44">
            {themes.map(({ label, value, icon: Icon }) => (
              <DropdownMenuItem key={value} onClick={() => setTheme(value)}>
                <Icon />
                {label}
                {theme === value && <CheckIcon className="ml-auto" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuItem onClick={() => setShortcutsOpen(true)}>
          <KeyboardIcon />
          Keyboard Shortcuts
          <Kbd className="ml-auto">?</Kbd>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
