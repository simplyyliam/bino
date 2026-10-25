import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CircleSlashIcon, PackageOpenIcon, WrenchIcon, XIcon } from "lucide-react";
import type { Building } from "@bino/types";
import { useBinStore, useItemStore, useMovementHistoryStore } from "@bino/store";
import { Button, toast } from "@bino/ui";
import { LocationTag } from "@/components/LocationTag";
import { StatusBadge } from "@/components/StatusBadge";
import type { BinSummary, Inventory } from "@/lib/inventory";
import { errorMessage, formatRelative } from "@/lib/format";
import { IconPicker } from "./IconPicker";
import { BinItemRow } from "./BinItemRow";
import { AddItemButton } from "./AddItemButton";

type BinInspectorProps = {
  summary: BinSummary;
  building: Building;
  inv: Inventory;
  onClose: () => void;
};

function LabelField({ binId, name, placeholder }: { binId: string; name: string; placeholder: string }) {
  const updateBin = useBinStore((s) => s.updateBin);
  const [draft, setDraft] = useState(name);

  const save = () => {
    const next = draft.trim();
    if (next === name) return;
    updateBin(binId, { name: next }).catch((err) => {
      setDraft(name);
      toast.error(errorMessage(err, "Couldn't rename the bin."));
    });
  };

  return (
    <input
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={save}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
        if (e.key === "Escape") {
          setDraft(name);
          e.currentTarget.blur();
        }
      }}
      placeholder={placeholder}
      aria-label="Bin label"
      className="-mx-1.5 w-full min-w-0 rounded-md bg-transparent px-1.5 py-0.5 text-lg font-medium tracking-tight outline-none transition-colors duration-150 placeholder:text-muted-foreground/70 hover:bg-accent focus:bg-accent"
    />
  );
}

export function BinInspector({ summary, building, inv, onClose }: BinInspectorProps) {
  const { bin, items, status } = summary;
  const setOutOfService = useBinStore((s) => s.setBinOutOfService);
  const markOutOfStock = useItemStore((s) => s.markBinOutOfStock);
  const history = useMovementHistoryStore((s) => s.history);

  const recent = useMemo(
    () => history.filter((e) => e.binId === bin.id || e.fromBinId === bin.id || e.toBinId === bin.id).slice(0, 5),
    [history, bin.id]
  );

  const toggleService = async () => {
    const next = !bin.isOutOfService;
    try {
      await setOutOfService(bin.id, next);
      toast(next ? "Bin marked out of service" : "Bin back in service", {
        action: { label: "Undo", onClick: () => void setOutOfService(bin.id, !next) },
      });
    } catch (err) {
      toast.error(errorMessage(err, "Couldn't update the bin."));
    }
  };

  const zeroAll = async () => {
    try {
      await markOutOfStock(bin.id);
      toast("All items set to 0");
    } catch (err) {
      toast.error(errorMessage(err, "Couldn't update the bin."));
    }
  };

  const hasStock = items.some((bi) => bi.quantity > 0);

  return (
    <aside
      aria-label={`Bin ${bin.locationCode}`}
      className="flex h-full w-[23rem] shrink-0 flex-col border-l border-border bg-background animate-in fade-in-0 slide-in-from-right-2 duration-200"
    >
      <div className="flex flex-col gap-4 p-5 pb-4">
        <div className="flex items-center gap-2">
          <LocationTag code={bin.locationCode} />
          <StatusBadge status={status} />
          <Button variant="ghost" size="icon-sm" className="ml-auto -mr-1.5 text-muted-foreground" onClick={onClose} aria-label="Close bin">
            <XIcon />
          </Button>
        </div>
        <div className="flex items-center gap-3">
          <IconPicker binId={bin.id} icon={bin.icon} />
          <div className="flex min-w-0 flex-1 flex-col">
            <LabelField key={`${bin.id}:${bin.name}`} binId={bin.id} name={bin.name} placeholder="Add a label" />
            <span className="text-xs text-muted-foreground">{building.name}</span>
          </div>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto scrollbar-thin">
        <section className="flex flex-col gap-2 px-5">
          <div className="flex items-center justify-between">
            <h3 className="text-[13px] font-medium">
              Items <span className="font-normal text-muted-foreground tabular-nums">{items.length || ""}</span>
            </h3>
            <AddItemButton bin={bin} />
          </div>

          {items.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-2xl bg-surface px-4 py-8 text-center">
              <PackageOpenIcon className="size-5 text-muted-foreground" strokeWidth={1.75} />
              <p className="text-[13px] text-muted-foreground">Nothing in this bin yet.</p>
            </div>
          ) : (
            <ul className="-mx-2 flex flex-col">
              {items.map((line) => (
                <BinItemRow key={line.id} line={line} bin={bin} inv={inv} />
              ))}
            </ul>
          )}
        </section>

        {recent.length > 0 && (
          <section className="mt-6 flex flex-col gap-2 px-5 pb-5">
            <div className="flex items-center justify-between">
              <h3 className="text-[13px] font-medium">Recent Activity</h3>
              <Link to={`/activity?building=${building.id}`} className="text-xs font-medium text-muted-foreground hover:text-foreground">
                View all
              </Link>
            </div>
            <ol className="flex flex-col gap-2.5">
              {recent.map((e) => (
                <li key={e.id} className="flex gap-2.5 text-xs">
                  <span aria-hidden className="mt-1.5 size-1.5 shrink-0 rounded-full bg-border" />
                  <span className="min-w-0 flex-1 text-foreground/85">{e.summary}</span>
                  <time dateTime={e.timestamp} className="shrink-0 text-muted-foreground">
                    {formatRelative(e.timestamp)}
                  </time>
                </li>
              ))}
            </ol>
          </section>
        )}
      </div>

      <div className="flex gap-2 p-4">
        <Button variant="outline" size="sm" className="flex-1" onClick={zeroAll} disabled={!hasStock}>
          <CircleSlashIcon /> Set All to 0
        </Button>
        <Button variant="outline" size="sm" className="flex-1" onClick={toggleService}>
          <WrenchIcon /> {bin.isOutOfService ? "Back in Service" : "Out of Service"}
        </Button>
      </div>
    </aside>
  );
}
