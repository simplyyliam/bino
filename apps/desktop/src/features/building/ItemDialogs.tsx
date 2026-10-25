import { useMemo, useState } from "react";
import { SearchIcon } from "lucide-react";
import type { Bin, BinItem } from "@bino/types";
import { useItemStore } from "@bino/store";
import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Textarea,
  cn,
  toast,
} from "@bino/ui";
import { LocationTag } from "@/components/LocationTag";
import { StatusSwatch } from "@/components/StatusBadge";
import { binTitle, type Inventory } from "@/lib/inventory";
import { errorMessage } from "@/lib/format";
import { emptyIcn, icnPayload, useIcnCheck } from "@/lib/icn";
import { IcnFields } from "./IcnFields";

type LineDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  line: BinItem;
  itemName: string;
};

export function LowStockDialog(props: LineDialogProps) {
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <LowStockForm {...props} />
      </DialogContent>
    </Dialog>
  );
}

function LowStockForm({ onOpenChange, line, itemName }: LineDialogProps) {
  const updateBinItem = useItemStore((s) => s.updateBinItem);
  const [value, setValue] = useState(line.minQuantity != null ? String(line.minQuantity) : "");

  const save = async (minQuantity: number | null) => {
    try {
      await updateBinItem(line.id, { minQuantity });
      toast(minQuantity == null ? "Low-stock alert turned off" : `You'll be alerted at ${minQuantity}`);
      onOpenChange(false);
    } catch (err) {
      toast.error(errorMessage(err, "Couldn't save the alert."));
    }
  };

  return (
    <>
        <form
          className="flex flex-col gap-5"
          onSubmit={(e) => {
            e.preventDefault();
            const n = Number.parseInt(value, 10);
            void save(Number.isNaN(n) ? null : Math.max(0, n));
          }}
        >
          <DialogHeader>
            <DialogTitle>Low-Stock Alert</DialogTitle>
            <DialogDescription>
              {itemName} shows up under Needs Attention once it drops to this number.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Label htmlFor="min-qty">Alert when at or below</Label>
            <Input
              id="min-qty"
              autoFocus
              inputMode="numeric"
              value={value}
              onChange={(e) => setValue(e.target.value.replace(/[^\d]/g, ""))}
              placeholder="e.g. 5"
            />
          </div>
          <DialogFooter>
            {line.minQuantity != null && (
              <Button type="button" variant="ghost" className="sm:mr-auto" onClick={() => void save(null)}>
                Turn Off
              </Button>
            )}
            <DialogClose render={<Button type="button" variant="outline" />}>Cancel</DialogClose>
            <Button type="submit" disabled={!value}>Save</Button>
          </DialogFooter>
        </form>
    </>
  );
}

export function NoteDialog(props: LineDialogProps) {
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <NoteForm {...props} />
      </DialogContent>
    </Dialog>
  );
}

function NoteForm({ onOpenChange, line, itemName }: LineDialogProps) {
  const updateBinItem = useItemStore((s) => s.updateBinItem);
  const [value, setValue] = useState(line.notes ?? "");

  const save = async () => {
    try {
      await updateBinItem(line.id, { notes: value.trim() || null });
      onOpenChange(false);
    } catch (err) {
      toast.error(errorMessage(err, "Couldn't save the note."));
    }
  };

  return (
    <>
        <DialogHeader>
          <DialogTitle>Note</DialogTitle>
          <DialogDescription>Anything worth remembering about the {itemName} in this bin.</DialogDescription>
        </DialogHeader>
        <Textarea autoFocus value={value} onChange={(e) => setValue(e.target.value)} placeholder="e.g. Spares for the lawnmower" rows={3} />
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancel</DialogClose>
          <Button onClick={() => void save()}>Save</Button>
        </DialogFooter>
    </>
  );
}

type MoveItemDialogProps = LineDialogProps & { fromBin: Bin; inv: Inventory };

export function MoveItemDialog(props: MoveItemDialogProps) {
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <MoveItemForm {...props} />
      </DialogContent>
    </Dialog>
  );
}

function MoveItemForm({ onOpenChange, line, itemName, fromBin, inv }: MoveItemDialogProps) {
  const moveBinItem = useItemStore((s) => s.moveBinItem);
  const [query, setQuery] = useState("");
  const [targetId, setTargetId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Bins in the same building first, then everything else.
  const options = useMemo(() => {
    const fromBuilding = inv.buildingForBin(fromBin.id);
    const q = query.trim().toLowerCase();
    return [...inv.summaries.values()]
      .filter((s) => s.bin.id !== fromBin.id && !s.bin.isOutOfService)
      .map((s) => ({ summary: s, building: inv.buildingForBin(s.bin.id) }))
      .filter(({ summary, building }) => {
        if (!q) return true;
        const names = summary.items.map((i) => inv.itemsById.get(i.itemId)?.name ?? "").join(" ");
        return `${summary.bin.locationCode} ${summary.bin.name} ${building?.name ?? ""} ${names}`.toLowerCase().includes(q);
      })
      .sort((a, b) => {
        const sameA = a.building?.id === fromBuilding?.id ? 0 : 1;
        const sameB = b.building?.id === fromBuilding?.id ? 0 : 1;
        return sameA - sameB || a.summary.bin.locationCode.localeCompare(b.summary.bin.locationCode, undefined, { numeric: true });
      })
      .slice(0, 80);
  }, [inv, fromBin.id, query]);

  const move = async (id = targetId) => {
    if (!id || saving) return;
    const target = inv.summaries.get(id)?.bin;
    setSaving(true);
    try {
      await moveBinItem(line.id, id);
      toast.success(`Moved ${itemName} to ${target ? binTitle(target) : "the new bin"}`);
      onOpenChange(false);
    } catch (err) {
      toast.error(errorMessage(err, "Couldn't move the item."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
        <DialogHeader>
          <DialogTitle>Move {itemName}</DialogTitle>
          <DialogDescription>
            All {line.quantity} move from {fromBin.locationCode}. If the new bin already has {itemName}, the counts are added together.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Find a bin by code, label or item" className="pl-9" />
        </div>

        <div role="listbox" aria-label="Bins" className="-mx-1 flex max-h-72 flex-col overflow-y-auto scrollbar-thin">
          {options.length === 0 && <p className="py-8 text-center text-[13px] text-muted-foreground">No bins match.</p>}
          {options.map(({ summary, building }) => (
            <button
              key={summary.bin.id}
              type="button"
              role="option"
              aria-selected={targetId === summary.bin.id}
              onClick={() => setTargetId(summary.bin.id)}
              onDoubleClick={() => void move(summary.bin.id)}
              className={cn(
                "flex items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors duration-100",
                targetId === summary.bin.id ? "bg-accent-blue/10" : "hover:bg-accent"
              )}
            >
              <StatusSwatch status={summary.status} />
              <LocationTag code={summary.bin.locationCode} className="h-5 text-[11px]" />
              <span className="min-w-0 flex-1 truncate text-[13px]">{summary.bin.name || <span className="text-muted-foreground">{summary.items.length ? `${summary.items.length} items` : "Empty"}</span>}</span>
              <span className="shrink-0 text-xs text-muted-foreground">{building?.name}</span>
            </button>
          ))}
        </div>

        <DialogFooter>
          <DialogClose render={<Button variant="outline" disabled={saving} />}>Cancel</DialogClose>
          <Button onClick={() => void move()} disabled={!targetId || saving}>
            {saving ? "Moving…" : "Move Here"}
          </Button>
        </DialogFooter>
    </>
  );
}

export function AddIcnDialog(props: LineDialogProps & { binCode: string }) {
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <AddIcnForm {...props} />
      </DialogContent>
    </Dialog>
  );
}

function AddIcnForm({ onOpenChange, line, itemName, binCode }: LineDialogProps & { binCode: string }) {
  const createICN = useItemStore((s) => s.createICN);
  const [draft, setDraft] = useState(emptyIcn);
  const [saving, setSaving] = useState(false);
  const check = useIcnCheck(draft);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (check.problem) return;
    setSaving(true);
    try {
      await createICN({ itemId: line.itemId, binItemId: line.id, ...icnPayload(draft, check.value) });
      toast.success(`${itemName} now has ${check.value ?? check.next}`);
      onOpenChange(false);
    } catch (err) {
      toast.error(errorMessage(err, "Couldn't add the ICN."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="flex flex-col gap-5" onSubmit={submit}>
      <DialogHeader>
        <DialogTitle>Add ICN</DialogTitle>
        <DialogDescription>
          Give the {itemName} in bin {binCode} its own tracking number.
        </DialogDescription>
      </DialogHeader>
      <IcnFields draft={draft} onChange={setDraft} next={check.next} problem={check.problem} autoFocus />
      <DialogFooter>
        <DialogClose render={<Button type="button" variant="outline" disabled={saving} />}>Cancel</DialogClose>
        <Button type="submit" disabled={saving || !!check.problem}>{saving ? "Adding…" : "Add ICN"}</Button>
      </DialogFooter>
    </form>
  );
}
