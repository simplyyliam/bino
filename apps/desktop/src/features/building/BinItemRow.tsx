import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRightLeftIcon, BellIcon, EllipsisIcon, StickyNoteIcon, TagIcon, Trash2Icon } from "lucide-react";
import type { Bin, BinItem } from "@bino/types";
import { useItemStore } from "@bino/store";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  cn,
  toast,
} from "@bino/ui";
import { QuantityStepper } from "@/components/QuantityStepper";
import { isLow, type Inventory } from "@/lib/inventory";
import { errorMessage, formatNumber } from "@/lib/format";
import { AddIcnDialog, LowStockDialog, MoveItemDialog, NoteDialog } from "./ItemDialogs";

type BinItemRowProps = {
  line: BinItem;
  bin: Bin;
  inv: Inventory;
};

export function BinItemRow({ line, bin, inv }: BinItemRowProps) {
  const navigate = useNavigate();
  const updateQuantity = useItemStore((s) => s.updateBinItemQuantity);
  const removeItem = useItemStore((s) => s.removeItemFromBin);
  const restoreItem = useItemStore((s) => s.restoreBinItem);
  const [dialog, setDialog] = useState<"alert" | "note" | "move" | "icn" | null>(null);

  const item = inv.itemsById.get(line.itemId);
  const icn = line.icnId ? inv.icnsById.get(line.icnId) : undefined;
  const low = isLow(line);
  const name = item?.name ?? "Unknown item";

  const setQuantity = (quantity: number) => {
    updateQuantity(line.id, quantity).catch((err) => toast.error(errorMessage(err, "Couldn't save the quantity.")));
  };

  const remove = async () => {
    try {
      const removed = await removeItem(line.id);
      toast(`Removed ${name}`, {
        action: removed
          ? {
              label: "Undo",
              onClick: () => restoreItem(removed).catch((err) => toast.error(errorMessage(err, "Couldn't put it back."))),
            }
          : undefined,
      });
    } catch (err) {
      toast.error(errorMessage(err, "Couldn't remove the item."));
    }
  };

  return (
    <li className="group flex items-center gap-3 rounded-xl px-2 py-2 transition-colors duration-150 hover:bg-surface">
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-[13px] font-medium">{name}</span>
        <span className="flex min-w-0 flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
          {icn && <span className="font-mono text-[11px]">{icn.value}</span>}
          {line.minQuantity != null && (
            <span className={cn("inline-flex items-center gap-1", (low || line.quantity === 0) && "font-medium text-bin-low-fg")}>
              <BellIcon className="size-3" />
              Alert at {formatNumber(line.minQuantity)}
            </span>
          )}
          {line.notes && <span className="truncate">{line.notes}</span>}
        </span>
      </div>

      <QuantityStepper
        value={line.quantity}
        onChange={setQuantity}
        label={`${name} quantity`}
        tone={line.quantity === 0 ? "out" : low ? "low" : "default"}
      />

      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="ghost" size="icon-xs" className="text-muted-foreground" aria-label={`${name} options`}>
              <EllipsisIcon />
            </Button>
          }
        />
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuItem onClick={() => setDialog("move")}>
            <ArrowRightLeftIcon /> Move to Another Bin…
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setDialog("alert")}>
            <BellIcon /> {line.minQuantity != null ? "Change Low-Stock Alert…" : "Set Low-Stock Alert…"}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setDialog("note")}>
            <StickyNoteIcon /> {line.notes ? "Edit Note…" : "Add Note…"}
          </DropdownMenuItem>
          {icn ? (
            <DropdownMenuItem onClick={() => navigate(`/icn/${encodeURIComponent(icn.value)}`)}>
              <TagIcon /> View {icn.value}
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={() => setDialog("icn")}>
              <TagIcon /> Add ICN…
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={remove}>
            <Trash2Icon /> Remove from Bin
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <LowStockDialog open={dialog === "alert"} onOpenChange={(o) => setDialog(o ? "alert" : null)} line={line} itemName={name} />
      <NoteDialog open={dialog === "note"} onOpenChange={(o) => setDialog(o ? "note" : null)} line={line} itemName={name} />
      <AddIcnDialog open={dialog === "icn"} onOpenChange={(o) => setDialog(o ? "icn" : null)} line={line} itemName={name} binCode={bin.locationCode} />
      <MoveItemDialog open={dialog === "move"} onOpenChange={(o) => setDialog(o ? "move" : null)} line={line} fromBin={bin} itemName={name} inv={inv} />
    </li>
  );
}
