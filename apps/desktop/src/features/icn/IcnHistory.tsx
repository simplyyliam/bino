import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import type { MovementHistoryEvent } from "@bino/types";
import { Tooltip, TooltipContent, TooltipTrigger } from "@bino/ui";
import { eventMeta } from "@/features/activity/events";
import { binLink, type Inventory } from "@/lib/inventory";
import { formatDateTime, formatNumber, formatRelative } from "@/lib/format";

// Solid underline = goes somewhere. Dashed = hover for more.
function BinRef({ binId, inv }: { binId?: string; inv: Inventory }) {
  const bin = binId ? inv.summaries.get(binId)?.bin : undefined;
  const building = binId ? inv.buildingForBin(binId) : undefined;
  if (!bin || !building) return <span className="text-muted-foreground">a removed bin</span>;
  return (
    <Link
      to={binLink(building.id, bin.id)}
      className="font-mono text-[12.5px] text-foreground/80 underline decoration-border decoration-1 underline-offset-[3px] transition-colors hover:text-foreground hover:decoration-foreground/40"
    >
      {bin.locationCode}
    </Link>
  );
}

function Qty({ before, after }: { before?: number | null; after?: number | null }) {
  if (after == null) return null;
  const label = formatNumber(after);
  if (before == null) return <span className="text-foreground/80 tabular-nums">{label}</span>;
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <span className="cursor-default text-foreground/80 tabular-nums underline decoration-muted-foreground/50 decoration-dashed decoration-1 underline-offset-[3px]">
            {label}
          </span>
        }
      />
      <TooltipContent>
        {formatNumber(before)} → {label}
      </TooltipContent>
    </Tooltip>
  );
}

function sentence(e: MovementHistoryEvent, inv: Inventory): ReactNode {
  const bin = <BinRef binId={e.binId ?? undefined} inv={inv} />;
  switch (e.eventType) {
    case "icn_created":
      return <>Tag created</>;
    case "item_added_to_bin":
      return <>Put in {bin} with <Qty after={e.quantityAfter} /></>;
    case "item_removed_from_bin":
      return <>Taken out of {bin}</>;
    case "item_moved_between_bins":
      return <>Moved from <BinRef binId={e.fromBinId ?? undefined} inv={inv} /> to <BinRef binId={e.toBinId ?? undefined} inv={inv} /></>;
    case "quantity_increased":
      return <>Restocked to <Qty before={e.quantityBefore} after={e.quantityAfter} /> in {bin}</>;
    case "quantity_decreased":
      return <>Down to <Qty before={e.quantityBefore} after={e.quantityAfter} /> in {bin}</>;
    case "marked_out_of_stock":
      return <>Set to 0 in {bin}</>;
    default:
      return e.summary;
  }
}

export function IcnHistory({ events, inv }: { events: MovementHistoryEvent[]; inv: Inventory }) {
  if (events.length === 0) {
    return <p className="text-[13px] text-muted-foreground">No changes yet.</p>;
  }

  return (
    <ol className="flex flex-col">
      {events.map((e, i) => {
        const Icon = eventMeta(e.eventType).icon;
        const last = i === events.length - 1;
        return (
          <li key={e.id} className="relative flex gap-3 pb-3.5 last:pb-0">
            {/* Thread line between entries */}
            {!last && <span aria-hidden className="absolute top-7 bottom-0 left-[13px] w-px bg-border" />}
            <span className="relative flex size-7 shrink-0 items-center justify-center rounded-full bg-surface text-muted-foreground">
              <Icon className="size-3.5" strokeWidth={1.75} />
            </span>
            <div className="flex min-w-0 flex-1 items-baseline justify-between gap-3 pt-1">
              <p className="text-[13px] leading-5 text-foreground/90">{sentence(e, inv)}</p>
              <time dateTime={e.timestamp} title={formatDateTime(e.timestamp)} className="shrink-0 text-xs text-muted-foreground tabular-nums">
                {formatRelative(e.timestamp)}
              </time>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
