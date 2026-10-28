import { useMemo, useState } from "react";
import { TriangleAlertIcon } from "lucide-react";
import type { Bin, LocationSystem, Storage } from "@bino/types";
import { sortBinsLastFirst, useBinStore } from "@bino/store";
import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  toast,
} from "@bino/ui";
import { QuantityStepper } from "@/components/QuantityStepper";
import { binTitle, type Inventory } from "@/lib/inventory";
import { errorMessage, plural } from "@/lib/format";

type LayoutDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storage: Storage;
  bins: Bin[];
  system?: LocationSystem;
  inv: Inventory;
  onEditCodes: () => void;
};

const MAX_BINS = 1000;

export function LayoutDialog(props: LayoutDialogProps) {
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <LayoutForm {...props} />
      </DialogContent>
    </Dialog>
  );
}

function LayoutForm({ onOpenChange, storage, bins, system, inv, onEditCodes }: LayoutDialogProps) {
  const createBins = useBinStore((s) => s.createBinsInStorage);
  const removeBins = useBinStore((s) => s.removeBinsFromStorage);
  const perColumn = system?.gridConfig?.racksPerColumn ?? 5;

  const [target, setTarget] = useState(bins.length);
  const [saving, setSaving] = useState(false);

  const delta = target - bins.length;
  const toRemove = useMemo(
    () => (delta < 0 ? sortBinsLastFirst(bins).slice(0, -delta) : []),
    [delta, bins]
  );
  const losing = toRemove.filter((b) => (inv.summaries.get(b.id)?.items.length ?? 0) > 0);

  const columns = Math.ceil(target / perColumn);

  const apply = async () => {
    setSaving(true);
    try {
      if (delta > 0) await createBins(storage.id, delta);
      if (delta < 0) await removeBins(storage.id, toRemove.map((b) => b.id));
      toast.success(delta > 0 ? `Added ${plural(delta, "bin")}` : `Removed ${plural(-delta, "bin")}`);
      onOpenChange(false);
    } catch (err) {
      toast.error(errorMessage(err, "Couldn't update the layout."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
        <DialogHeader>
          <DialogTitle>Edit Layout</DialogTitle>
          <DialogDescription>
            Bins fill each column top to bottom ({perColumn} per column), then start the next one. New bins go on the end; removing takes from the end.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 rounded-xl bg-surface p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col">
              <span className="text-[13px] font-medium">Bins</span>
              <span className="text-xs text-muted-foreground tabular-nums">{plural(columns, "column")}</span>
            </div>
            <QuantityStepper value={target} onChange={(n) => setTarget(Math.min(MAX_BINS, n))} label="Number of bins" />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="flex-1" onClick={() => setTarget((t) => Math.min(MAX_BINS, (Math.floor(t / perColumn) + 1) * perColumn))}>
              Add a Column
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              disabled={target === 0}
              onClick={() => setTarget((t) => Math.max(0, (Math.ceil(t / perColumn) - 1) * perColumn))}
            >
              Remove Last Column
            </Button>
          </div>
        </div>

        {losing.length > 0 && (
          <div role="alert" className="flex gap-3 rounded-xl bg-bin-out/60 p-3.5 text-[13px] text-bin-out-fg">
            <TriangleAlertIcon className="mt-0.5 size-4 shrink-0" />
            <p>
              {losing.length === 1 ? "One bin you're removing still has items" : `${losing.length} bins you're removing still have items`}{" "}
              ({losing.slice(0, 3).map((b) => binTitle(b)).join(", ")}
              {losing.length > 3 ? "…" : ""}). Those items will be removed too, and this can't be undone.
            </p>
          </div>
        )}

        <button
          type="button"
          onClick={onEditCodes}
          className="self-start text-[13px] font-medium text-accent-blue underline-offset-4 hover:underline"
        >
          Change bin code format…
        </button>

        <DialogFooter>
          <DialogClose render={<Button variant="outline" disabled={saving} />}>Cancel</DialogClose>
          <Button
            variant={losing.length ? "destructive" : "default"}
            loading={saving}
            disabled={delta === 0}
            onClick={apply}
          >
            {saving
              ? "Saving…"
              : delta > 0
                ? `Add ${plural(delta, "Bin")}`
                : delta < 0
                  ? `Remove ${plural(-delta, "Bin")}`
                  : "No Changes"}
          </Button>
        </DialogFooter>
    </>
  );
}
