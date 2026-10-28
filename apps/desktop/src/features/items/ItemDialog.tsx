import { useMemo, useState } from "react";
import type { Item } from "@bino/types";
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
  toast,
} from "@bino/ui";
import { errorMessage } from "@/lib/format";

type ItemDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Pass an item to edit it; leave empty to create one.
  item?: Item;
};

export function ItemDialog(props: ItemDialogProps) {
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <ItemForm {...props} />
      </DialogContent>
    </Dialog>
  );
}

function ItemForm({ onOpenChange, item }: ItemDialogProps) {
  const items = useItemStore((s) => s.items);
  const createItem = useItemStore((s) => s.createItem);
  const updateItem = useItemStore((s) => s.updateItem);

  const [name, setName] = useState(item?.name ?? "");
  const [category, setCategory] = useState(item?.category ?? "");
  const [description, setDescription] = useState(item?.description ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const categories = useMemo(
    () => [...new Set(items.map((i) => i.category).filter(Boolean) as string[])].sort(),
    [items]
  );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setError("Give the item a name.");
    setSaving(true);
    setError(null);
    const fields = { name: name.trim(), category: category.trim() || undefined, description: description.trim() || undefined };
    try {
      if (item) {
        await updateItem(item.id, { ...fields, category: fields.category ?? null, description: fields.description ?? null });
        toast.success("Item updated");
      } else {
        await createItem(fields);
        toast.success(`${fields.name} added. Put it in a bin from any building.`);
      }
      onOpenChange(false);
    } catch (err) {
      setError(errorMessage(err, "Couldn't save the item."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
        <form onSubmit={submit} className="flex flex-col gap-5">
          <DialogHeader>
            <DialogTitle>{item ? "Edit Item" : "New Item"}</DialogTitle>
            <DialogDescription>
              {item ? "Changes show up everywhere this item is stored." : "Add it to the catalogue now and put it in a bin later."}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Label htmlFor="edit-item-name">Name</Label>
            <Input id="edit-item-name" autoFocus value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="edit-item-category">Category</Label>
            <Input id="edit-item-category" list="edit-item-categories" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Optional" />
            <datalist id="edit-item-categories">
              {categories.map((c) => <option key={c} value={c} />)}
            </datalist>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="edit-item-description">Description</Label>
            <Textarea id="edit-item-description" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="Optional" />
          </div>
          {error && <p role="alert" className="text-[13px] text-destructive">{error}</p>}
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" disabled={saving} />}>Cancel</DialogClose>
            <Button type="submit" loading={saving} disabled={!name.trim()}>{saving ? "Saving…" : item ? "Save" : "Add Item"}</Button>
          </DialogFooter>
        </form>
    </>
  );
}
