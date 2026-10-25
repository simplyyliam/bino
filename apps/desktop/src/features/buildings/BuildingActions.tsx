import { useState, type ReactElement, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRightIcon, DownloadIcon, HistoryIcon, PencilIcon, Trash2Icon } from "lucide-react";
import type { Building } from "@bino/types";
import { useBuildingStore } from "@bino/store";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  cn,
  toast,
} from "@bino/ui";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useInventory } from "@/lib/inventory";
import { exportBuildingCsv } from "@/lib/exports";
import { errorMessage, plural } from "@/lib/format";
import { BuildingDialog } from "./BuildingDialog";

type BuildingActionsProps = {
  building: Building;
  trigger: ReactElement;
  align?: "start" | "end";
};

// The ··· menu on a building.
export function BuildingActions({ building, trigger, align = "end" }: BuildingActionsProps) {
  return <BuildingMenu kind="dropdown" building={building} trigger={trigger} align={align} />;
}

// The same actions on right-click, plus Open (used in the sidebar).
// `className` styles the wrapper, which carries data-popup-open while the menu is open.
export function BuildingContextMenu({ building, children, className }: { building: Building; children: ReactNode; className?: string }) {
  return <BuildingMenu kind="context" building={building} trigger={<div className={cn("contents", className)}>{children}</div>} />;
}

const MENU_PARTS = {
  dropdown: { Item: DropdownMenuItem, Separator: DropdownMenuSeparator },
  context: { Item: ContextMenuItem, Separator: ContextMenuSeparator },
};

function BuildingMenu({ kind, building, trigger, align = "end" }: BuildingActionsProps & { kind: keyof typeof MENU_PARTS }) {
  const navigate = useNavigate();
  const inv = useInventory();
  const deleteBuilding = useBuildingStore((s) => s.deleteBuilding);
  const [renaming, setRenaming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const storage = inv.storageByBuilding.get(building.id);
  const bins = storage ? inv.binsByStorage.get(storage.id) ?? [] : [];
  const itemLines = bins.reduce((n, bin) => n + (inv.summaries.get(bin.id)?.items.length ?? 0), 0);

  const remove = async () => {
    // Leave the page first so it doesn't flash "not found" as the data goes.
    navigate("/");
    try {
      await deleteBuilding(building.id);
      toast.success(`${building.name} deleted`);
    } catch (err) {
      toast.error(errorMessage(err, "Couldn't delete the building."));
    }
  };

  const { Item, Separator } = MENU_PARTS[kind];
  const items = (
    <>
      {kind === "context" && (
        <>
          <Item onClick={() => navigate(`/buildings/${building.id}`)}>
            <ArrowRightIcon /> Open
          </Item>
          <Separator />
        </>
      )}
      <Item onClick={() => setRenaming(true)}>
        <PencilIcon /> Rename…
      </Item>
      <Item onClick={() => navigate(`/activity?building=${building.id}`)}>
        <HistoryIcon /> View Activity
      </Item>
      <Item onClick={() => exportBuildingCsv(inv, building)}>
        <DownloadIcon /> Export Inventory (CSV)
      </Item>
      <Separator />
      <Item variant="destructive" onClick={() => setDeleting(true)}>
        <Trash2Icon /> Delete Building…
      </Item>
    </>
  );

  return (
    <>
      {kind === "dropdown" ? (
        <DropdownMenu>
          <DropdownMenuTrigger render={trigger} />
          <DropdownMenuContent align={align} className="w-52">{items}</DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <ContextMenu>
          <ContextMenuTrigger render={trigger} />
          <ContextMenuContent className="w-56">{items}</ContextMenuContent>
        </ContextMenu>
      )}

      <BuildingDialog open={renaming} onOpenChange={setRenaming} building={building} />
      <ConfirmDialog
        open={deleting}
        onOpenChange={setDeleting}
        title={`Delete “${building.name}”?`}
        description={
          bins.length > 0
            ? `This removes ${plural(bins.length, "bin")}${itemLines ? ` and ${plural(itemLines, "item record")}` : ""}, along with their history. This can't be undone.`
            : "This can't be undone."
        }
        confirmLabel="Delete Building"
        onConfirm={remove}
      />
    </>
  );
}
