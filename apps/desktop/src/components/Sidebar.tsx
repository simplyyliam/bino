import { useState, type ReactNode } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { HistoryIcon, LayoutGridIcon, PackageIcon, PlusIcon, SearchIcon, type LucideIcon } from "lucide-react";
import { Button, Kbd, Tooltip, TooltipContent, TooltipTrigger, cn } from "@bino/ui";
import { useSearchStore } from "@bino/store";
import { useInventory } from "@/lib/inventory";
import { useAlerts } from "@/lib/alerts";
import { modKey } from "@/lib/format";
import { BuildingDialog } from "@/features/buildings/BuildingDialog";
import { BuildingContextMenu } from "@/features/buildings/BuildingActions";
import { BuildingGlyph } from "./BuildingGlyph";
import { SidebarToggle } from "./TopBar";
import { WorkspaceMenu } from "./WorkspaceMenu";

const focusRing = "outline-none focus-visible:ring-3 focus-visible:ring-ring";

const rowClass = (active: boolean) =>
  cn(
    "group flex h-8 items-center gap-2.5 rounded-lg px-2 text-[14px] transition-colors duration-100",
    focusRing,
    active ? "bg-sidebar-accent text-foreground" : "text-foreground/80 hover:bg-sidebar-accent/60 hover:text-foreground"
  );

const rowIcon = "size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground/80 group-aria-[current=page]:text-foreground";

function RowLink({ to, icon: Icon, label, end, trailing }: { to: string; icon: LucideIcon; label: string; end?: boolean; trailing?: ReactNode }) {
  return (
    <NavLink to={to} end={end} className={({ isActive }) => rowClass(isActive)}>
      <Icon className={rowIcon} strokeWidth={1.75} />
      <span className="truncate">{label}</span>
      {trailing && <span className="ml-auto flex items-center">{trailing}</span>}
    </NavLink>
  );
}

function RowButton({ icon: Icon, label, onClick }: { icon: LucideIcon; label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={rowClass(false)}>
      <Icon className={rowIcon} strokeWidth={1.75} />
      <span className="truncate">{label}</span>
    </button>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return <h2 className="px-2 pb-1 text-[12px] text-muted-foreground">{children}</h2>;
}

export function Sidebar() {
  const inv = useInventory();
  const alerts = useAlerts(inv);
  const location = useLocation();
  const setSearchOpen = useSearchStore((s) => s.setOpen);
  const [creating, setCreating] = useState(false);

  const attentionByBuilding = new Map<string, number>();
  for (const a of alerts) attentionByBuilding.set(a.buildingId, (attentionByBuilding.get(a.buildingId) ?? 0) + 1);

  return (
    <aside
      aria-label="Sidebar"
      className="flex w-[264px] shrink-0 flex-col border-r border-sidebar-border bg-sidebar animate-in fade-in-0 slide-in-from-left-2 duration-200"
    >
      <div className="flex h-12 shrink-0 items-center gap-1 pr-2.5 pl-3">
        <WorkspaceMenu onNewBuilding={() => setCreating(true)} />
        <div className="ml-auto flex items-center">
          <Tooltip>
            <TooltipTrigger
              render={
                <Button variant="ghost" size="icon-xs" className="text-muted-foreground hover:text-foreground" onClick={() => setSearchOpen(true)} aria-label="Search">
                  <SearchIcon className="size-4" />
                </Button>
              }
            />
            <TooltipContent className="gap-2">
              Search <Kbd>{modKey} K</Kbd>
            </TooltipContent>
          </Tooltip>
          <SidebarToggle />
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-3 pt-1.5 pb-4 scrollbar-thin">
        <nav aria-label="Main" className="flex flex-col gap-px">
          <RowButton icon={PlusIcon} label="New Building" onClick={() => setCreating(true)} />
          <RowLink
            to="/"
            end
            icon={LayoutGridIcon}
            label="Overview"
            trailing={
              alerts.length > 0 && (
                <span
                  className="flex h-4.5 min-w-4.5 items-center justify-center rounded-[5px] bg-destructive px-1 text-[11px] font-medium text-white tabular-nums"
                  title={`${alerts.length} need attention`}
                >
                  {alerts.length}
                </span>
              )
            }
          />
          <RowLink to="/items" icon={PackageIcon} label="Items" />
          <RowLink to="/activity" icon={HistoryIcon} label="Activity" />
        </nav>

        <section aria-label="Buildings" className="flex flex-col">
          <SectionLabel>Buildings</SectionLabel>
          {inv.buildings.length === 0 && <p className="px-2 py-1.5 text-[14px] text-faint-foreground">No buildings yet</p>}
          <div className="flex flex-col gap-px">
            {inv.buildings.map((b) => {
              const active = location.pathname === `/buildings/${b.id}`;
              const count = attentionByBuilding.get(b.id) ?? 0;
              return (
                <BuildingContextMenu key={b.id} building={b} className="[&[data-popup-open]>a]:bg-sidebar-accent/60 [&[data-popup-open]>a]:text-foreground">
                  <NavLink to={`/buildings/${b.id}`} className={rowClass(active)}>
                    <BuildingGlyph id={b.id} name={b.name} className="size-4.5 rounded-[5px] text-[10px]" />
                    <span className="truncate">{b.name}</span>
                    {count > 0 && <span className="mr-1 ml-auto size-1.5 shrink-0 rounded-full bg-bin-out-fg" title={`${count} need attention`} />}
                  </NavLink>
                </BuildingContextMenu>
              );
            })}
          </div>
        </section>
      </div>

      <BuildingDialog open={creating} onOpenChange={setCreating} />
    </aside>
  );
}
