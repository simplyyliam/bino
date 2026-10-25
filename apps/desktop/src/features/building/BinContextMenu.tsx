import { useState, type ReactNode } from "react";
import { CircleSlashIcon, CopyIcon, PanelRightOpenIcon, WrenchIcon } from "lucide-react";
import { useBinStore, useItemStore } from "@bino/store";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
  toast,
} from "@bino/ui";
import type { Inventory } from "@/lib/inventory";
import { copyText } from "@/lib/clipboard";
import { errorMessage } from "@/lib/format";

type BinContextMenuProps = {
  inv: Inventory;
  onOpen: (binId: string) => void;
  children: ReactNode;
};

// Right-click anywhere on the grid; the menu acts on whichever bin was under the pointer.
export function BinContextMenu({ inv, onOpen, children }: BinContextMenuProps) {
  const [binId, setBinId] = useState<string | null>(null);
  const setOutOfService = useBinStore((s) => s.setBinOutOfService);
  const markOutOfStock = useItemStore((s) => s.markBinOutOfStock);
  const summary = binId ? inv.summaries.get(binId) : undefined;

  const run = (action: () => Promise<unknown>, done: string) =>
    action()
      .then(() => toast(done))
      .catch((err) => toast.error(errorMessage(err, "Couldn't update the bin.")));

  return (
    <ContextMenu>
      <ContextMenuTrigger
        render={
          <div
            className="contents"
            onContextMenu={(e) => {
              const id = (e.target as HTMLElement).closest<HTMLElement>("[data-bin]")?.dataset.bin ?? null;
              setBinId(id);
              if (!id) e.preventDefault();
            }}
          />
        }
      >
        {children}
      </ContextMenuTrigger>
      {summary && (
        <ContextMenuContent className="w-52">
          <ContextMenuItem onClick={() => onOpen(summary.bin.id)}>
            <PanelRightOpenIcon /> Open Bin
          </ContextMenuItem>
          <ContextMenuItem onClick={() => copyText(summary.bin.locationCode)}>
            <CopyIcon /> Copy Code
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem
            disabled={!summary.items.some((i) => i.quantity > 0)}
            onClick={() => run(() => markOutOfStock(summary.bin.id), "All items set to 0")}
          >
            <CircleSlashIcon /> Set All to 0
          </ContextMenuItem>
          <ContextMenuItem
            onClick={() =>
              run(
                () => setOutOfService(summary.bin.id, !summary.bin.isOutOfService),
                summary.bin.isOutOfService ? "Bin back in service" : "Bin marked out of service"
              )
            }
          >
            <WrenchIcon /> {summary.bin.isOutOfService ? "Back in Service" : "Out of Service"}
          </ContextMenuItem>
        </ContextMenuContent>
      )}
    </ContextMenu>
  );
}
