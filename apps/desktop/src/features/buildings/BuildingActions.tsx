import { useState, type ReactElement } from "react";
import { useNavigate } from "react-router-dom";
import { DownloadIcon, HistoryIcon, PencilIcon, Trash2Icon } from "lucide-react";
import type { Building } from "@bino/types";
import { useBuildingStore } from "@bino/store";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
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

export function BuildingActions({ building, trigger, align = "end" }: BuildingActionsProps) {
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

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={trigger} />
        <DropdownMenuContent align={align} className="w-52">
          <DropdownMenuItem onClick={() => setRenaming(true)}>
            <PencilIcon /> Rename…
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => navigate(`/activity?building=${building.id}`)}>
            <HistoryIcon /> View Activity
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => exportBuildingCsv(inv, building)}>
            <DownloadIcon /> Export Inventory (CSV)
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={() => setDeleting(true)}>
            <Trash2Icon /> Delete Building…
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

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
