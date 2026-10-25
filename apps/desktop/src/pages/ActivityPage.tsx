import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { DownloadIcon, HistoryIcon, Trash2Icon } from "lucide-react";
import type { MovementHistoryEvent } from "@bino/types";
import { useMovementHistoryStore } from "@bino/store";
import { Button, Checkbox, NativeSelect, cn, toast } from "@bino/ui";
import { Page, PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { LocationTag } from "@/components/LocationTag";
import { SearchField } from "@/components/SearchField";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { EVENT_KINDS, eventMeta, type EventKind } from "@/features/activity/events";
import { binLink, useInventory } from "@/lib/inventory";
import { dayLabel, errorMessage, formatNumber, plural } from "@/lib/format";
import { downloadCsv } from "@/lib/csv";

const PAGE = 100;

export default function ActivityPage() {
  const inv = useInventory();
  const history = useMovementHistoryStore((s) => s.history);
  const deleteEvents = useMovementHistoryStore((s) => s.deleteHistoryEvents);
  const [params, setParams] = useSearchParams();
  const buildingId = params.get("building") ?? "";
  const [kind, setKind] = useState<EventKind | "">("");
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(PAGE);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirming, setConfirming] = useState(false);

  const setBuilding = (id: string) =>
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      if (id) next.set("building", id);
      else next.delete("building");
      return next;
    }, { replace: true });

  const placeOf = (event: MovementHistoryEvent) => {
    const binId = event.toBinId ?? event.binId;
    if (!binId) return undefined;
    const bin = inv.summaries.get(binId)?.bin;
    const building = inv.buildingForBin(binId);
    return bin && building ? { bin, building } : undefined;
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return history.filter((e) => {
      if (kind && eventMeta(e.eventType).kind !== kind) return false;
      if (buildingId) {
        const ids = [e.binId, e.fromBinId, e.toBinId].filter(Boolean) as string[];
        if (!ids.some((id) => inv.buildingForBin(id)?.id === buildingId)) return false;
      }
      if (q && !e.summary.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [history, kind, buildingId, query, inv]);

  const shown = filtered.slice(0, limit);
  const groups = useMemo(() => {
    const out: { label: string; events: MovementHistoryEvent[] }[] = [];
    for (const e of shown) {
      const label = dayLabel(e.timestamp);
      const last = out[out.length - 1];
      if (last?.label === label) last.events.push(e);
      else out.push({ label, events: [e] });
    }
    return out;
  }, [shown]);

  const building = buildingId ? inv.buildingsById.get(buildingId) : undefined;

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const remove = async () => {
    try {
      await deleteEvents([...selected]);
      toast.success(`Deleted ${plural(selected.size, "entry", "entries")}`);
      setSelected(new Set());
    } catch (err) {
      toast.error(errorMessage(err, "Couldn't delete those entries."));
    }
  };

  const exportCsv = () =>
    downloadCsv(
      "bino-activity.csv",
      ["When", "What", "Details", "Building", "Bin", "Before", "After"],
      filtered.map((e) => {
        const place = placeOf(e);
        return [
          new Date(e.timestamp).toLocaleString(),
          eventMeta(e.eventType).label,
          e.summary,
          place?.building.name ?? "",
          place?.bin.locationCode ?? "",
          e.quantityBefore ?? "",
          e.quantityAfter ?? "",
        ];
      })
    );

  return (
    <Page className="max-w-4xl">
      <PageHeader
        title="Activity"
        description={building ? `Everything that's changed in ${building.name}` : "Everything that's changed, newest first"}
        actions={
          <Button variant="outline" onClick={exportCsv} disabled={filtered.length === 0}>
            <DownloadIcon /> Export CSV
          </Button>
        }
      />

      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <SearchField value={query} onChange={setQuery} placeholder="Search activity" />
          <NativeSelect value={buildingId} onChange={(e) => setBuilding(e.target.value)} aria-label="Building" className="w-48">
            <option value="">All buildings</option>
            {inv.buildings.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </NativeSelect>
          <NativeSelect value={kind} onChange={(e) => setKind(e.target.value as EventKind | "")} aria-label="Type of change" className="w-52">
            <option value="">All changes</option>
            {EVENT_KINDS.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
          </NativeSelect>
          {selected.size > 0 && (
            <div className="ml-auto flex items-center gap-2 animate-in fade-in-0 duration-150">
              <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())}>Clear</Button>
              <Button variant="destructive" size="sm" onClick={() => setConfirming(true)}>
                <Trash2Icon /> Delete {selected.size}
              </Button>
            </div>
          )}
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-2xl bg-card shadow-card">
            <EmptyState
              icon={HistoryIcon}
              title={history.length ? "No activity matches" : "No activity yet"}
              description={history.length ? "Try a different filter." : "Changes you make to bins and items will show up here."}
            />
          </div>
        ) : (
          groups.map((group) => (
            <section key={group.label} className="flex flex-col gap-2">
              <h2 className="px-1 text-xs font-medium text-muted-foreground">
                {group.label}
              </h2>
              <ol className="overflow-hidden rounded-xl bg-card shadow-card">
                {group.events.map((e) => {
                  const meta = eventMeta(e.eventType);
                  const Icon = meta.icon;
                  const place = placeOf(e);
                  const isSelected = selected.has(e.id);
                  return (
                    <li
                      key={e.id}
                      className={cn(
                        "group flex items-center gap-3 border-b border-border px-4 py-3 last:border-0 transition-colors duration-150",
                        isSelected ? "bg-primary/5" : "hover:bg-accent/40"
                      )}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggle(e.id)}
                        aria-label="Select entry"
                        className={cn("transition-opacity", !isSelected && selected.size === 0 && "opacity-0 group-hover:opacity-100 focus-visible:opacity-100")}
                      />
                      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface text-muted-foreground">
                        <Icon className="size-4" strokeWidth={1.75} />
                      </span>
                      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className="text-[13px] text-foreground">{e.summary}</span>
                        <span className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{meta.label}</span>
                          {place && (
                            <>
                              <span aria-hidden>·</span>
                              <span>{place.building.name}</span>
                            </>
                          )}
                        </span>
                      </div>
                      {e.quantityBefore != null && e.quantityAfter != null && (
                        <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                          {formatNumber(e.quantityBefore)} → <span className="font-semibold text-foreground">{formatNumber(e.quantityAfter)}</span>
                        </span>
                      )}
                      {place && (
                        <Link to={binLink(place.building.id, place.bin.id)} className="shrink-0 rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring">
                          <LocationTag code={place.bin.locationCode} className="h-5 text-[11px] transition-colors hover:bg-accent" />
                        </Link>
                      )}
                      <time dateTime={e.timestamp} className="w-16 shrink-0 text-right text-xs text-muted-foreground tabular-nums">
                        {new Date(e.timestamp).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                      </time>
                    </li>
                  );
                })}
              </ol>
            </section>
          ))
        )}

        {filtered.length > limit && (
          <Button variant="outline" className="self-center" onClick={() => setLimit((l) => l + PAGE)}>
            Show More ({formatNumber(filtered.length - limit)} older)
          </Button>
        )}
      </div>

      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        title={`Delete ${plural(selected.size, "entry", "entries")}?`}
        description="They'll be removed from the activity history for good. Your stock counts won't change."
        confirmLabel="Delete"
        onConfirm={remove}
      />
    </Page>
  );
}
