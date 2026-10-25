import { useState, type ReactNode } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { HistoryIcon, KeyboardIcon, LayoutGridIcon, PackageIcon, PlusIcon, SearchIcon, type LucideIcon } from "lucide-react";
import { Button, Kbd, Tooltip, TooltipContent, TooltipTrigger, cn } from "@bino/ui";
import { useSearchStore, useUiStore } from "@bino/store";
import { useInventory } from "@/lib/inventory";
import { useAlerts } from "@/lib/alerts";
import { modKey } from "@/lib/format";
import { BuildingDialog } from "@/features/buildings/BuildingDialog";
import { BuildingContextMenu } from "@/features/buildings/BuildingActions";
import { BuildingGlyph } from "./BuildingGlyph";
import { LogoMark } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";
import { SidebarToggle } from "./TopBar";

const itemClass = (active: boolean) =>
  cn(
    "group flex h-8 items-center gap-2.5 rounded-lg px-2 text-[13px] outline-none transition-colors duration-100 focus-visible:ring-3 focus-visible:ring-ring",
    active ? "bg-sidebar-accent font-medium text-foreground" : "text-foreground/75 hover:bg-sidebar-accent/70 hover:text-foreground"
  );

function NavItem({ to, icon: Icon, label, end, trailing }: { to: string; icon: LucideIcon; label: string; end?: boolean; trailing?: ReactNode }) {
  return (
    <NavLink to={to} end={end} className={({ isActive }) => itemClass(isActive)}>
      <Icon className="size-4 shrink-0 text-muted-foreground group-aria-[current=page]:text-foreground" strokeWidth={1.75} />
      <span className="truncate">{label}</span>
      {trailing && <span className="ml-auto">{trailing}</span>}
    </NavLink>
  );
}

export function Sidebar() {
  const inv = useInventory();
  const alerts = useAlerts(inv);
  const location = useLocation();
  const setSearchOpen = useSearchStore((s) => s.setOpen);
  const setShortcutsOpen = useUiStore((s) => s.setShortcutsOpen);
  const [creating, setCreating] = useState(false);

  const attentionByBuilding = new Map<string, number>();
  for (const a of alerts) attentionByBuilding.set(a.buildingId, (attentionByBuilding.get(a.buildingId) ?? 0) + 1);

  return (
    <aside aria-label="Sidebar" className="flex w-60 shrink-0 flex-col gap-4 px-2.5 py-3 animate-in fade-in-0 slide-in-from-left-2 duration-200">
      <div className="flex items-center gap-2 px-1.5">
        <LogoMark className="size-5" />
        <span className="text-[14px] font-semibold tracking-tight">Bino</span>
        <span className="ml-auto">
          <SidebarToggle />
        </span>
      </div>

      <button type="button" onClick={() => setSearchOpen(true)} className={cn(itemClass(false), "text-muted-foreground")}>
        <SearchIcon className="size-4" strokeWidth={1.75} />
        Search
        <span className="ml-auto flex gap-0.5 opacity-80">
          <Kbd>{modKey}</Kbd>
          <Kbd>K</Kbd>
        </span>
      </button>

      <nav aria-label="Main" className="flex flex-col gap-0.5">
        <NavItem
          to="/"
          end
          icon={LayoutGridIcon}
          label="Overview"
          trailing={
            alerts.length > 0 && (
              <span className="flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-bin-out px-1.5 text-[11px] font-medium text-bin-out-fg tabular-nums" title={`${alerts.length} need attention`}>
                {alerts.length}
              </span>
            )
          }
        />
        <NavItem to="/items" icon={PackageIcon} label="Items" />
        <NavItem to="/activity" icon={HistoryIcon} label="Activity" />
      </nav>

      <div className="flex min-h-0 flex-1 flex-col gap-1">
        <div className="flex h-7 items-center justify-between pr-0.5 pl-2">
          <span className="text-xs font-medium text-muted-foreground">Buildings</span>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button variant="ghost" size="icon-xs" className="size-6" onClick={() => setCreating(true)} aria-label="New building">
                  <PlusIcon />
                </Button>
              }
            />
            <TooltipContent>New building</TooltipContent>
          </Tooltip>
        </div>
        <div className="-mx-1 flex min-h-0 flex-col gap-0.5 overflow-y-auto px-1 scrollbar-thin">
          {inv.buildings.length === 0 && <p className="px-2 py-1 text-xs text-faint-foreground">No buildings yet</p>}
          {inv.buildings.map((b) => {
            const active = location.pathname === `/buildings/${b.id}`;
            const count = attentionByBuilding.get(b.id) ?? 0;
            return (
              <BuildingContextMenu key={b.id} building={b} className="[&[data-popup-open]>a]:bg-sidebar-accent/70 [&[data-popup-open]>a]:text-foreground">
                <NavLink to={`/buildings/${b.id}`} className={itemClass(active)}>
                  <BuildingGlyph id={b.id} name={b.name} />
                  <span className="truncate">{b.name}</span>
                  {count > 0 && (
                    <span className="ml-auto size-1.5 shrink-0 rounded-full bg-bin-out-fg" title={`${count} need attention`} />
                  )}
                </NavLink>
              </BuildingContextMenu>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-1 px-0.5">
        <ThemeToggle />
        <Tooltip>
          <TooltipTrigger
            render={
              <Button variant="ghost" size="icon-sm" onClick={() => setShortcutsOpen(true)} aria-label="Keyboard shortcuts">
                <KeyboardIcon />
              </Button>
            }
          />
          <TooltipContent className="gap-2">
            Keyboard shortcuts <Kbd>?</Kbd>
          </TooltipContent>
        </Tooltip>
      </div>

      <BuildingDialog open={creating} onOpenChange={setCreating} />
    </aside>
  );
}
