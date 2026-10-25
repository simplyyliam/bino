import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Building2Icon, CheckCircle2Icon, EllipsisIcon, PlusIcon } from "lucide-react";
import type { Building } from "@bino/types";
import { Button } from "@bino/ui";
import { Page, PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { LocationTag } from "@/components/LocationTag";
import { StatusSwatch } from "@/components/StatusBadge";
import { BuildingDialog } from "@/features/buildings/BuildingDialog";
import { BuildingActions } from "@/features/buildings/BuildingActions";
import { MiniBinMap } from "@/features/buildings/MiniBinMap";
import { binLink, binTitle, countStatuses, isLow, useInventory, type BinStatus, type Inventory } from "@/lib/inventory";
import { formatNumber, plural } from "@/lib/format";
import { useLocationSystemStore } from "@bino/store";

type Alert = {
  key: string;
  status: BinStatus;
  title: string;
  detail: string;
  code: string;
  buildingName: string;
  href: string;
  rank: number;
};

// Things worth a look today: out of stock first, then low, then broken bins.
function useAlerts(inv: Inventory) {
  return useMemo(() => {
    const alerts: Alert[] = [];
    for (const summary of inv.summaries.values()) {
      const building = inv.buildingForBin(summary.bin.id);
      if (!building) continue;
      const href = binLink(building.id, summary.bin.id);
      const base = { code: summary.bin.locationCode, buildingName: building.name, href };

      if (summary.status === "service") {
        alerts.push({ ...base, key: `svc-${summary.bin.id}`, status: "service", title: binTitle(summary.bin), detail: "Out of service", rank: 2 });
        continue;
      }
      for (const line of summary.items) {
        const name = inv.itemsById.get(line.itemId)?.name ?? "Unknown item";
        if (line.quantity === 0) {
          alerts.push({ ...base, key: line.id, status: "out", title: name, detail: "Out of stock", rank: 0 });
        } else if (isLow(line)) {
          alerts.push({
            ...base,
            key: line.id,
            status: "low",
            title: name,
            detail: `${formatNumber(line.quantity)} left · alert at ${formatNumber(line.minQuantity!)}`,
            rank: 1,
          });
        }
      }
    }
    return alerts.sort((a, b) => a.rank - b.rank || a.title.localeCompare(b.title));
  }, [inv]);
}

function NeedsAttention({ alerts }: { alerts: Alert[] }) {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? alerts : alerts.slice(0, 6);

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <h2 className="text-[13px] font-medium text-muted-foreground">Needs Attention</h2>
        {alerts.length > 0 && <span className="text-xs text-muted-foreground tabular-nums">{alerts.length}</span>}
      </div>
      {alerts.length === 0 ? (
        <div className="flex items-center gap-3 rounded-[20px] bg-card px-5 py-4 text-[13px] text-muted-foreground shadow-card">
          <CheckCircle2Icon className="size-4 text-foreground/60" />
          Nothing's low, empty or out of service. All good.
        </div>
      ) : (
        <div className="rounded-[20px] bg-card p-1.5 shadow-card">
          <ul className="flex flex-col">
            {shown.map((a) => (
              <li key={a.key}>
                <Link
                  to={a.href}
                  className="flex items-center gap-3 rounded-[14px] px-3.5 py-2.5 transition-colors duration-150 outline-none hover:bg-surface focus-visible:bg-surface"
                >
                  <StatusSwatch status={a.status} />
                  <span className="min-w-0 flex-1 truncate text-[13px] font-medium">{a.title}</span>
                  <span className="hidden text-xs text-muted-foreground sm:inline">{a.detail}</span>
                  <span className="w-28 truncate text-right text-xs text-muted-foreground">{a.buildingName}</span>
                  <LocationTag code={a.code} className="h-5 text-[11px]" />
                </Link>
              </li>
            ))}
          </ul>
          {alerts.length > 6 && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="mt-0.5 w-full rounded-[14px] px-3.5 py-2 text-left text-xs font-medium text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
            >
              {expanded ? "Show less" : `Show all ${alerts.length}`}
            </button>
          )}
        </div>
      )}
    </section>
  );
}

function BuildingCard({ building, inv }: { building: Building; inv: Inventory }) {
  const systems = useLocationSystemStore((s) => s.locationSystems);
  const storage = inv.storageByBuilding.get(building.id);
  const bins = storage ? inv.binsByStorage.get(storage.id) ?? [] : [];
  const summaries = bins.map((b) => inv.summaries.get(b.id)!).filter(Boolean);
  const counts = countStatuses(summaries);
  const system = systems.find((s) => s.id === storage?.locationSystemId);
  const rows = Math.max(system?.gridConfig?.racksPerColumn ?? 5, ...bins.map((b) => b.row + 1));
  const attention = counts.low + counts.out + counts.service;

  return (
    <div className="group relative flex flex-col gap-5 rounded-[22px] bg-card p-5 shadow-card transition-shadow duration-200 hover:shadow-raised">
      <Link
        to={`/buildings/${building.id}`}
        className="absolute inset-0 rounded-[22px] outline-none focus-visible:ring-3 focus-visible:ring-ring"
        aria-label={`Open ${building.name}`}
      />
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-col">
          <h3 className="truncate text-[15px] font-medium">{building.name}</h3>
          <span className="text-xs text-muted-foreground">
            {building.buildingNumber ? `Building ${building.buildingNumber} · ` : ""}
            {plural(bins.length, "bin")}
          </span>
        </div>
        <BuildingActions
          building={building}
          trigger={
            <Button variant="ghost" size="icon-xs" className="relative -mt-1 -mr-1 text-muted-foreground" aria-label={`${building.name} options`}>
              <EllipsisIcon />
            </Button>
          }
        />
      </div>

      <div className="pointer-events-none flex h-24 items-center overflow-hidden rounded-2xl bg-surface px-3.5">
        {bins.length > 0 ? (
          <MiniBinMap bins={bins} summaries={inv.summaries} rows={rows} />
        ) : (
          <span className="w-full text-center text-xs text-muted-foreground">No bins yet</span>
        )}
      </div>

      <dl className="pointer-events-none grid grid-cols-3 gap-2 text-xs">
        <div>
          <dt className="text-muted-foreground">In use</dt>
          <dd className="text-sm font-medium tabular-nums">{formatNumber(counts.stocked + counts.low + counts.out)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Empty</dt>
          <dd className="text-sm font-medium tabular-nums">{formatNumber(counts.empty)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Attention</dt>
          <dd className={attention ? "text-sm font-medium text-bin-out-fg tabular-nums" : "text-sm font-medium tabular-nums"}>
            {formatNumber(attention)}
          </dd>
        </div>
      </dl>
    </div>
  );
}

export default function OverviewPage() {
  const inv = useInventory();
  const alerts = useAlerts(inv);
  const [creating, setCreating] = useState(false);

  const newButton = (
    <Button onClick={() => setCreating(true)}>
      <PlusIcon /> New Building
    </Button>
  );

  return (
    <Page>
      <PageHeader
        title="Overview"
        description={
          inv.buildings.length
            ? `${plural(inv.buildings.length, "building")} · ${plural(inv.items.length, "item")} tracked`
            : undefined
        }
        actions={inv.buildings.length > 0 && newButton}
      />

      {inv.buildings.length === 0 ? (
        <div className="rounded-[22px] bg-card shadow-card">
          <EmptyState
            icon={Building2Icon}
            title="Set up your first building"
            description="Add the shed, workshop or warehouse where your bins live. You'll get a grid of bins to fill in."
            action={newButton}
          />
        </div>
      ) : (
        <>
          <NeedsAttention alerts={alerts} />
          <section className="flex flex-col gap-3">
            <h2 className="text-[13px] font-medium text-muted-foreground">Buildings</h2>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {inv.buildings.map((b) => (
                <BuildingCard key={b.id} building={b} inv={inv} />
              ))}
            </div>
          </section>
        </>
      )}

      <BuildingDialog open={creating} onOpenChange={setCreating} />
    </Page>
  );
}
