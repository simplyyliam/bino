import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowRightIcon, ChevronLeftIcon, MapPinOffIcon } from "lucide-react";
import { useMovementHistoryStore } from "@bino/store";
import { Button } from "@bino/ui";
import { Page } from "@/components/PageHeader";
import { LocationTag } from "@/components/LocationTag";
import { StatusBadge } from "@/components/StatusBadge";
import { binLink, binTitle, useInventory } from "@/lib/inventory";
import { formatDate, formatNumber, formatRelative } from "@/lib/format";
import NotFoundPage from "./NotFoundPage";

const METADATA_LABELS: Record<string, string> = {
  manufacturer: "Manufacturer",
  partNumber: "Part number",
  serialNumber: "Serial number",
};

export default function IcnPage() {
  const { icnValue = "" } = useParams();
  const inv = useInventory();
  const history = useMovementHistoryStore((s) => s.history);

  const value = decodeURIComponent(icnValue).trim().toUpperCase();
  const icn = inv.icns.find((i) => i.value.toUpperCase() === value);
  const item = icn ? inv.itemsById.get(icn.itemId) : undefined;
  const line = icn ? inv.binItems.find((bi) => bi.icnId === icn.id) : undefined;
  const summary = line ? inv.summaries.get(line.binId) : undefined;
  const building = line ? inv.buildingForBin(line.binId) : undefined;

  const events = useMemo(() => (icn ? history.filter((e) => e.icnId === icn.id).slice(0, 10) : []), [history, icn]);

  if (!icn || !item) {
    return <NotFoundPage title={`No ICN called “${value}”`} description="Check the number on the tag and try again." />;
  }

  const details = [
    ["Item", item.name],
    ["Category", item.category],
    ["Description", item.description],
    ...Object.entries(icn.metadata ?? {}).map(([k, v]) => [METADATA_LABELS[k] ?? k, String(v)]),
    ["Created", formatDate(icn.createdAt)],
  ].filter(([, v]) => v) as [string, string][];

  return (
    <Page className="max-w-3xl">
      <div className="flex flex-col gap-1">
        <Link to="/items" className="flex w-fit items-center gap-0.5 text-xs font-medium text-muted-foreground hover:text-foreground">
          <ChevronLeftIcon className="size-3.5" /> Items
        </Link>
        <h1 className="font-mono text-2xl font-semibold tracking-tight">{icn.value}</h1>
        <p className="text-[13px] text-muted-foreground">{item.name}</p>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold">Where it is</h2>
        {summary && building && line ? (
          <div className="flex flex-wrap items-center gap-4 rounded-xl bg-card p-4 shadow-card">
            <LocationTag code={summary.bin.locationCode} />
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-[13px] font-medium">{binTitle(summary.bin)}</span>
              <span className="text-xs text-muted-foreground">{building.name}</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-lg font-semibold tabular-nums">{formatNumber(line.quantity)}</span>
              <span className="text-xs text-muted-foreground">in the bin</span>
            </div>
            <StatusBadge status={summary.status} />
            <Button variant="outline" render={<Link to={binLink(building.id, summary.bin.id)} />}>
              Open Bin <ArrowRightIcon />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-xl border border-dashed border-border p-4 text-[13px] text-muted-foreground">
            <MapPinOffIcon className="size-4" /> Not in any bin right now.
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold">Details</h2>
        <dl className="divide-y divide-border rounded-xl bg-card shadow-card">
          {details.map(([label, v]) => (
            <div key={label} className="flex gap-4 px-4 py-3 text-[13px]">
              <dt className="w-32 shrink-0 text-muted-foreground">{label}</dt>
              <dd className="min-w-0 flex-1">{v}</dd>
            </div>
          ))}
        </dl>
      </section>

      {events.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold">History</h2>
          <ol className="flex flex-col gap-2.5">
            {events.map((e) => (
              <li key={e.id} className="flex gap-3 text-[13px]">
                <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-border" />
                <span className="min-w-0 flex-1">{e.summary}</span>
                <time dateTime={e.timestamp} className="shrink-0 text-xs text-muted-foreground">{formatRelative(e.timestamp)}</time>
              </li>
            ))}
          </ol>
        </section>
      )}
    </Page>
  );
}
