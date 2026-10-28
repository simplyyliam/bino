import { useState } from "react";
import { Link } from "react-router-dom";
import { Building2Icon, CheckCircle2Icon, EllipsisIcon, LayoutGridIcon, PlusIcon } from "lucide-react";
import type { Building } from "@bino/types";
import { useLocationSystemStore } from "@bino/store";
import { Button, Kbd, Tooltip, TooltipContent, TooltipTrigger } from "@bino/ui";
import { Page, Section } from "@/components/Page";
import { TopBar } from "@/components/TopBar";
import { EmptyState } from "@/components/EmptyState";
import { LocationTag } from "@/components/LocationTag";
import { StatusSwatch } from "@/components/StatusBadge";
import { BuildingGlyph } from "@/components/BuildingGlyph";
import { BuildingDialog } from "@/features/buildings/BuildingDialog";
import { BuildingActions } from "@/features/buildings/BuildingActions";
import { MiniBinMap } from "@/features/buildings/MiniBinMap";
import { countStatuses, useInventory, type Inventory } from "@/lib/inventory";
import { useAlerts, type Alert } from "@/lib/alerts";
import { useHotkey } from "@/lib/hotkeys";
import { formatNumber, plural } from "@/lib/format";

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
};

function Stat({ label, value, tone }: { label: string; value: number; tone?: "alert" }) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl bg-card px-4 py-3.5 shadow-card">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={tone === "alert" && value > 0 ? "text-xl font-medium text-bin-out-fg tabular-nums" : "text-xl font-medium tabular-nums"}>
        {formatNumber(value)}
      </span>
    </div>
  );
}

function NeedsAttention({ alerts }: { alerts: Alert[] }) {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? alerts : alerts.slice(0, 6);

  return (
    <Section title="Needs Attention" meta={alerts.length > 0 ? alerts.length : undefined}>
      {alerts.length === 0 ? (
        <div className="flex items-center gap-3 rounded-2xl bg-card px-4 py-3.5 text-[13px] text-muted-foreground shadow-card">
          <CheckCircle2Icon className="size-4 text-foreground/50" strokeWidth={1.75} />
          Nothing's low, empty or out of service. All good.
        </div>
      ) : (
        <div className="rounded-2xl bg-card p-1 shadow-card">
          <ul className="flex flex-col">
            {shown.map((a) => (
              <li key={a.key}>
                <Link
                  to={a.href}
                  className="flex items-center gap-3 rounded-xl px-3 py-2 transition-colors duration-100 outline-none hover:bg-surface focus-visible:bg-surface"
                >
                  <StatusSwatch status={a.status} />
                  <span className="min-w-0 flex-1 truncate text-[13px]">{a.title}</span>
                  <span className="hidden text-xs text-muted-foreground sm:inline">{a.detail}</span>
                  <span className="flex w-36 items-center justify-end gap-1.5 truncate text-xs text-muted-foreground">
                    <BuildingGlyph id={a.buildingId} name={a.buildingName} className="size-4 rounded text-[9px]" />
                    <span className="truncate">{a.buildingName}</span>
                  </span>
                  <LocationTag code={a.code} className="h-5 text-[11px]" />
                </Link>
              </li>
            ))}
          </ul>
          {alerts.length > 6 && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="w-full rounded-xl px-3 py-2 text-left text-xs font-medium text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
            >
              {expanded ? "Show less" : `Show all ${alerts.length}`}
            </button>
          )}
        </div>
      )}
    </Section>
  );
}

function BuildingCard({ building, inv }: { building: Building; inv: Inventory }) {
  const systems = useLocationSystemStore((s) => s.locationSystems);
  const storage = inv.storageByBuilding.get(building.id);
  const bins = storage ? inv.binsByStorage.get(storage.id) ?? [] : [];
  const counts = countStatuses(bins.map((b) => inv.summaries.get(b.id)!).filter(Boolean));
  const system = systems.find((s) => s.id === storage?.locationSystemId);
  const rows = Math.max(system?.gridConfig?.racksPerColumn ?? 5, ...bins.map((b) => b.row + 1));
  const attention = counts.low + counts.out + counts.service;

  return (
    <div className="group relative flex flex-col gap-4 rounded-2xl bg-card p-4 shadow-card transition-shadow duration-200 hover:shadow-raised">
      <Link
        to={`/buildings/${building.id}`}
        className="absolute inset-0 rounded-2xl outline-none focus-visible:ring-3 focus-visible:ring-ring"
        aria-label={`Open ${building.name}`}
      />
      <div className="flex items-center gap-2.5">
        <BuildingGlyph id={building.id} name={building.name} className="size-7 rounded-lg text-[13px]" />
        <div className="flex min-w-0 flex-1 flex-col">
          <h3 className="truncate text-[14px] font-medium">{building.name}</h3>
          <span className="text-xs text-muted-foreground">
            {building.buildingNumber ? `Building ${building.buildingNumber} · ` : ""}
            {plural(bins.length, "bin")}
          </span>
        </div>
        <BuildingActions
          building={building}
          trigger={
            <Button variant="ghost" size="icon-xs" className="relative text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 aria-expanded:opacity-100" aria-label={`${building.name} options`}>
              <EllipsisIcon />
            </Button>
          }
        />
      </div>

      <div className="pointer-events-none flex h-24 items-center overflow-hidden rounded-xl bg-surface px-3">
        {bins.length > 0 ? (
          <MiniBinMap bins={bins} summaries={inv.summaries} rows={rows} />
        ) : (
          <span className="w-full text-center text-xs text-muted-foreground">No bins yet</span>
        )}
      </div>

      <dl className="pointer-events-none flex gap-5 text-xs">
        <div className="flex items-baseline gap-1.5">
          <dd className="font-medium tabular-nums">{formatNumber(counts.stocked + counts.low + counts.out)}</dd>
          <dt className="text-muted-foreground">in use</dt>
        </div>
        <div className="flex items-baseline gap-1.5">
          <dd className="font-medium tabular-nums">{formatNumber(counts.empty)}</dd>
          <dt className="text-muted-foreground">empty</dt>
        </div>
        {attention > 0 && (
          <div className="ml-auto flex items-baseline gap-1.5 text-bin-out-fg">
            <dd className="font-medium tabular-nums">{formatNumber(attention)}</dd>
            <dt>need a look</dt>
          </div>
        )}
      </dl>
    </div>
  );
}

export default function OverviewPage() {
  const inv = useInventory();
  const alerts = useAlerts(inv);
  const [creating, setCreating] = useState(false);
  useHotkey("c", () => setCreating(true));

  const totalUnits = inv.binItems.reduce((sum, bi) => sum + bi.quantity, 0);
  const binsInUse = [...inv.summaries.values()].filter((s) => s.items.length > 0).length;

  return (
    <>
      <TopBar
        crumbs={[{ label: "Overview", icon: LayoutGridIcon }]}
        actions={
          <Tooltip>
            <TooltipTrigger
              render={
                <Button size="sm" onClick={() => setCreating(true)}>
                  <PlusIcon /> New Building
                </Button>
              }
            />
            <TooltipContent className="gap-2">
              New building <Kbd>C</Kbd>
            </TooltipContent>
          </Tooltip>
        }
      />
      <Page>
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-medium tracking-tight">{greeting()}</h1>
          <p className="text-[13px] text-muted-foreground">
            {alerts.length > 0
              ? `${plural(alerts.length, "thing")} could use a look today.`
              : inv.buildings.length
                ? "Everything's stocked and in service."
                : "Let's get your first building set up."}
          </p>
        </div>

        {inv.buildings.length === 0 ? (
          <div className="rounded-2xl bg-card shadow-card">
            <EmptyState
              icon={Building2Icon}
              title="Set up your first building"
              description="Add the shed, workshop or warehouse where your bins live. You'll get a grid of bins to fill in."
              action={
                <Button onClick={() => setCreating(true)}>
                  <PlusIcon /> New Building
                </Button>
              }
            />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Stat label="Items tracked" value={inv.items.length} />
              <Stat label="In stock" value={totalUnits} />
              <Stat label="Bins in use" value={binsInUse} />
              <Stat label="Need attention" value={alerts.length} tone="alert" />
            </div>
            <NeedsAttention alerts={alerts} />
            <Section title="Buildings" meta={inv.buildings.length}>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {inv.buildings.map((b) => (
                  <BuildingCard key={b.id} building={b} inv={inv} />
                ))}
              </div>
            </Section>
          </>
        )}

        <BuildingDialog open={creating} onOpenChange={setCreating} />
      </Page>
    </>
  );
}
