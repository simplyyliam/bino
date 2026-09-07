import { useState } from "react";
import { IconButton } from "@/shared/components";
import { useBinStore, useStorageStore, useLocationSystemStore } from "@bino/store";
import { FieldGroup, Button } from "@bino/ui";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
  DialogClose
} from "@bino/ui/components/ui/dialog";
import { Config, Settings02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useParams } from "react-router-dom";
import { ConfigSetting } from "./config-setting";
import { LocationSystemEditorDialog } from "@/features/building/components/LocationSystemEditorDialog";

interface MenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ConfigMenu = ({ open, onOpenChange }: MenuProps) => {
  const { buildingId } = useParams();
  const storages = useStorageStore((s) => s.storages)
  const bins = useBinStore((s) => s.bins)
  const createBinInStorage = useBinStore((s) => s.createBinInStorage)
  const createBinsInStorage = useBinStore((s) => s.createBinsInStorage)
  const removeLastBinFromStorage = useBinStore((s) => s.removeLastBinFromStorage)
  const removeLastBinsFromStorage = useBinStore((s) => s.removeLastBinsFromStorage)
  const  locationSystems  = useLocationSystemStore((s) => s.locationSystems);

  const [editorOpen, setEditorOpen] = useState(false);

  const storage = storages.find((s) => s.buildingId === buildingId);
  const locationSystem = locationSystems.find((ls) => ls.id === storage?.locationSystemId);
  const storageBins = storage ? bins.filter((b) => b.storageId === storage.id) : [];

  const racksPerColumn = locationSystem?.gridConfig?.racksPerColumn ?? 5;
  const maxColumns = locationSystem?.gridConfig?.maxColumns ?? 18;
  const maxBins = racksPerColumn * maxColumns;
  const columnsCount = Math.ceil(storageBins.length / racksPerColumn);

  const updateBinCount = async (nextCount: number, errorMessage: string) => {
    if (!storage) return;

    const delta = nextCount - storageBins.length;
    if (delta === 0) return;

    try {
      if (delta > 0) {
        await createBinsInStorage(storage.id, delta);
      } else {
        await removeLastBinsFromStorage(storage.id, Math.abs(delta));
      }
    } catch (error) {
      console.error(errorMessage, error);
    }
  };

  const handleAddBin = async () => {
    if (!storage) return;
    try {
      await createBinInStorage(storage.id);
    } catch (error) {
      console.error("Failed to create bin:", error);
    }
  };

  const handleRemoveBin = async () => {
    if (!storage) return;
    try {
      await removeLastBinFromStorage(storage.id);
    } catch (error) {
      console.error("Failed to remove bin:", error);
    }
  };

  const handleAddColumn = async () => {
    if (!storage) return;
    try {
      // One request for the whole column instead of racksPerColumn sequential ones.
      await createBinsInStorage(storage.id, racksPerColumn);
    } catch (error) {
      console.error("Failed to add column:", error);
    }
  };

  const handleRemoveColumn = async () => {
    if (!storage) return;
    try {
      await removeLastBinsFromStorage(storage.id, racksPerColumn);
    } catch (error) {
      console.error("Failed to remove column:", error);
    }
  };

  if (!storage) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogTrigger render={<IconButton Icon={Config} />} />
        <DialogContent className="min-w-0 w-80">
          <DialogHeader>
            <DialogTitle>Bin Configuration</DialogTitle>
            <DialogDescription>No storage found for this building</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  const latestBin = storageBins[storageBins.length - 1];

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogTrigger render={<IconButton Icon={Config} />} />
        <DialogContent className="min-w-0 w-84">
          <DialogHeader>
            <DialogTitle>Bin Configuration</DialogTitle>
            <DialogDescription>
              Quickly adjust your bin capacity and layout using the controls below.
            </DialogDescription>
          </DialogHeader>

          <FieldGroup className="gap-3">
            {/* Stepper Controls */}
            <ConfigSetting
              label="Bins"
              value={storageBins.length}
              onIncrement={handleAddBin}
              onDecrement={handleRemoveBin}
              onValueChange={(nextValue) =>
                updateBinCount(nextValue, "Failed to update bin count:")
              }
              min={0}
              max={maxBins}
            />
            <ConfigSetting
              label="Columns"
              value={columnsCount}
              onIncrement={handleAddColumn}
              onDecrement={handleRemoveColumn}
              onValueChange={(nextValue) =>
                updateBinCount(
                  nextValue * racksPerColumn,
                  "Failed to update column count:"
                )
              }
              min={0}
              max={maxColumns}
            />
            <ConfigSetting
              label={`Rows (${racksPerColumn} per column)`}
              value={racksPerColumn}
              min={racksPerColumn}
              max={racksPerColumn}
              disabled
            />

            {/* Quick Stats */}
            {storageBins.length > 0 && (
              <div className="flex flex-col gap-1 p-2.5 rounded-md bg-muted/40 text-xs">
                <div className="flex justify-between text-muted-foreground">
                  <span>Latest Bin Code:</span>
                  <span className="font-mono font-medium text-foreground">
                    {latestBin?.locationCode}
                  </span>
                </div>
              </div>
            )}

            {/* Hierarchy & Location System Customize Button */}
            <div className="pt-2 border-t border-border/70 flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-medium">System Hierarchy</span>
                <span className="font-mono font-semibold text-foreground truncate max-w-36">
                  {locationSystem?.name || "Standard"}
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs gap-1.5 h-8 mt-1"
                onClick={() => {
                  onOpenChange(false);
                  setEditorOpen(true);
                }}
              >
                <HugeiconsIcon icon={Settings02Icon} className="size-3.5" />
                Customize Hierarchy & Axis Labels
              </Button>
            </div>
          </FieldGroup>

          <DialogFooter>
            <DialogClose render={<Button variant="outline" className="w-full">Done</Button>} />
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {locationSystem && (
        <LocationSystemEditorDialog
          open={editorOpen}
          onOpenChange={setEditorOpen}
          systemId={locationSystem.id}
          storageId={storage.id}
        />
      )}
    </>
  );
};
