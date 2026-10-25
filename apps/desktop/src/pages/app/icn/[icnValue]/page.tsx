import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowRightIcon, MapPinOffIcon, SmartphoneIcon } from "lucide-react";
import { useMovementHistoryStore } from "@bino/store";
import { Button } from "@bino/ui";
import { Page } from "@/components/Page";
import { TopBar } from "@/components/TopBar";
import { LocationTag } from "@/components/LocationTag";
import { StatusBadge } from "@/components/StatusBadge";
import { binLink, binTitle, useInventory } from "@/lib/inventory";
import { formatDate, formatNumber, formatRelative } from "@/lib/format";
import NotFound from "@/components/NotFound";

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
    return <NotFound title={`No ICN called “${value}”`} description="Check the number on the tag and try again." />;
  }

  const details = [
    ["Item", item.name],
    ["Category", item.category],
    ["Description", item.description],
    ...Object.entries(icn.metadata ?? {}).map(([k, v]) => [METADATA_LABELS[k] ?? k, String(v)]),
    ["Created", formatDate(icn.createdAt)],
  ].filter(([, v]) => v) as [string, string][];

  return (
    <>
    <TopBar
      crumbs={[{ label: "Items", to: "/items" }, { label: icn.value }]}
      actions={
        <Button variant="ghost" size="sm" nativeButton={false} render={<Link to={`/tag/${encodeURIComponent(icn.value)}`} />}>
          <SmartphoneIcon /> Tag View
        </Button>
      }
    />
    <Page className="max-w-3xl">
      <div className="flex flex-col gap-1">
        <h1 className="font-mono text-2xl font-medium tracking-tight">{icn.value}</h1>
        <p className="text-[13px] text-muted-foreground">{item.name}</p>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium">Where it is</h2>
        {summary && building && line ? (
          <div className="flex flex-wrap items-center gap-4 rounded-2xl bg-card p-4 shadow-card">
            <LocationTag code={summary.bin.locationCode} />
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-[13px] font-medium">{binTitle(summary.bin)}</span>
              <span className="text-xs text-muted-foreground">{building.name}</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-lg font-medium tabular-nums">{formatNumber(line.quantity)}</span>
              <span className="text-xs text-muted-foreground">in the bin</span>
            </div>
            <StatusBadge status={summary.status} />
            <Button variant="outline" nativeButton={false} render={<Link to={binLink(building.id, summary.bin.id)} />}>
              Open Bin <ArrowRightIcon />
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-2xl bg-card p-4 text-[13px] text-muted-foreground shadow-card">
            <MapPinOffIcon className="size-4" /> Not in any bin right now.
          </div>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-medium">Details</h2>
        <dl className="flex flex-col rounded-2xl bg-card p-1.5 shadow-card">
          {details.map(([label, v]) => (
            <div key={label} className="flex gap-4 rounded-xl px-3.5 py-2.5 text-[13px]">
              <dt className="w-32 shrink-0 text-muted-foreground">{label}</dt>
              <dd className="min-w-0 flex-1">{v}</dd>
            </div>
          ))}
        </dl>
      </section>

      {events.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-sm font-medium">History</h2>
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
    </>
  );
}
