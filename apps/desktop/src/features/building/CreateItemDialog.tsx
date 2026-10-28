import { useMemo, useState } from "react";
import type { Bin } from "@bino/types";
import { useItemStore } from "@bino/store";
import {
  Button,
  Checkbox,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  toast,
} from "@bino/ui";
import { QuantityStepper } from "@/components/QuantityStepper";
import { errorMessage } from "@/lib/format";
import { emptyIcn, icnPayload, useIcnCheck } from "@/lib/icn";
import { IcnFields } from "./IcnFields";

type CreateItemDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialName: string;
  bin: Bin;
};

const empty = { category: "", description: "", alert: "" };

export function CreateItemDialog(props: CreateItemDialogProps) {
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <CreateItemForm {...props} />
      </DialogContent>
    </Dialog>
  );
}

function CreateItemForm({ onOpenChange, initialName, bin }: CreateItemDialogProps) {
  const items = useItemStore((s) => s.items);
  const createItem = useItemStore((s) => s.createItem);
  const createICN = useItemStore((s) => s.createICN);
  const deleteItem = useItemStore((s) => s.deleteItem);
  const addItemToBin = useItemStore((s) => s.addItemToBin);

  const [name, setName] = useState(initialName);
  const [fields, setFields] = useState(empty);
  const [quantity, setQuantity] = useState(1);
  const [withIcn, setWithIcn] = useState(false);
  const [icnDraft, setIcnDraft] = useState(emptyIcn);
  const icnCheck = useIcnCheck(icnDraft);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categories = useMemo(
    () => [...new Set(items.map((i) => i.category).filter(Boolean) as string[])].sort(),
    [items]
  );
  const duplicate = items.find((i) => i.name.trim().toLowerCase() === name.trim().toLowerCase());

  const set = (key: keyof typeof empty) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setFields((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setError("Give the item a name.");
    if (withIcn && icnCheck.problem) return setError(icnCheck.problem);
    setSaving(true);
    setError(null);
    try {
      const itemId = await createItem({
        name: name.trim(),
        category: fields.category.trim() || undefined,
        description: fields.description.trim() || undefined,
      });
      let icnId: string | undefined;
      if (withIcn) {
        try {
          icnId = await createICN({ itemId, ...icnPayload(icnDraft, icnCheck.value) });
        } catch (err) {
          // Don't leave a half-made item behind, or trying again makes a duplicate.
          await deleteItem(itemId).catch(() => undefined);
          throw err;
        }
      }
      const alert = Number.parseInt(fields.alert, 10);
      await addItemToBin(bin.id, itemId, {
        quantity,
        icnId,
        minQuantity: Number.isNaN(alert) ? null : alert,
      });
      toast.success(`Added ${name.trim()}`);
      onOpenChange(false);
    } catch (err) {
      setError(errorMessage(err, "Couldn't create the item."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
        <form onSubmit={submit} className="flex flex-col gap-5">
          <DialogHeader>
            <DialogTitle>New Item</DialogTitle>
            <DialogDescription>It'll go into bin {bin.locationCode}. You can reuse it in other bins later.</DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-2">
            <Label htmlFor="item-name">Name</Label>
            <Input id="item-name" autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. M6 hex bolts" />
            {duplicate && (
              <p className="text-xs text-muted-foreground">
                There's already an item called “{duplicate.name}”. You can still create another.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="item-category">Category</Label>
              <Input id="item-category" list="item-categories" value={fields.category} onChange={set("category")} placeholder="Optional" />
              <datalist id="item-categories">
                {categories.map((c) => <option key={c} value={c} />)}
              </datalist>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="item-alert">Low-stock alert</Label>
              <Input
                id="item-alert"
                inputMode="numeric"
                value={fields.alert}
                onChange={(e) => setFields((f) => ({ ...f, alert: e.target.value.replace(/[^\d]/g, "") }))}
                placeholder="Optional"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="item-description">Description</Label>
            <Input id="item-description" value={fields.description} onChange={set("description")} placeholder="Optional" />
          </div>

          <div className="flex items-center justify-between gap-4">
            <span className="text-[13px] font-medium">How many are going in?</span>
            <QuantityStepper value={quantity} onChange={setQuantity} label="Starting quantity" />
          </div>

          <div className="flex flex-col gap-3 rounded-xl bg-surface p-3.5">
            <label className="flex cursor-pointer items-start gap-3">
              <Checkbox checked={withIcn} onCheckedChange={(v) => setWithIcn(!!v)} className="mt-0.5" />
              <span className="flex flex-col">
                <span className="text-[13px] font-medium">Give it an ICN</span>
                <span className="text-xs text-muted-foreground">A unique tracking number for one specific part. Use your own or get the next one.</span>
              </span>
            </label>
            {withIcn && (
              <div className="animate-in fade-in-0 duration-150">
                <IcnFields draft={icnDraft} onChange={setIcnDraft} next={icnCheck.next} problem={icnCheck.problem} />
              </div>
            )}
          </div>

          {error && <p role="alert" className="text-[13px] text-destructive">{error}</p>}

          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" disabled={saving} />}>Cancel</DialogClose>
            <Button type="submit" loading={saving} disabled={!name.trim() || (withIcn && !!icnCheck.problem)}>{saving ? "Adding…" : "Add to Bin"}</Button>
          </DialogFooter>
        </form>
    </>
  );
}
