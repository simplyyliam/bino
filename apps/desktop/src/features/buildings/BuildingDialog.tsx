import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Building } from "@bino/types";
import { generateLocationCode } from "@bino/data";
import { useBinStore, useBuildingStore, useLocationSystemStore, useStorageStore } from "@bino/store";
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
  cn,
  toast,
} from "@bino/ui";
import { errorMessage } from "@/lib/format";
import { LocationTag } from "@/components/LocationTag";
import { QuantityStepper } from "@/components/QuantityStepper";

type BuildingDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Pass a building to rename it; leave empty to create a new one.
  building?: Building;
};

export function BuildingDialog({ open, onOpenChange, building }: BuildingDialogProps) {
  const navigate = useNavigate();
  const addBuilding = useBuildingStore((s) => s.addBuilding);
  const updateBuilding = useBuildingStore((s) => s.updateBuilding);
  const addStorage = useStorageStore((s) => s.addStorage);
  const createBins = useBinStore((s) => s.createBinsInStorage);
  const systems = useLocationSystemStore((s) => s.locationSystems);

  const [name, setName] = useState("");
  const [number, setNumber] = useState("");
  const [systemId, setSystemId] = useState("");
  const [binCount, setBinCount] = useState(20);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEdit = !!building;

  useEffect(() => {
    if (!open) return;
    setName(building?.name ?? "");
    setNumber(building?.buildingNumber ?? "");
    setSystemId(systems[0]?.id ?? "");
    setBinCount(20);
    setError(null);
  }, [open, building, systems]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setError("Give the building a name.");
    setSaving(true);
    setError(null);
    try {
      if (isEdit) {
        await updateBuilding(building.id, { name: name.trim(), buildingNumber: number.trim() });
        toast.success("Building updated");
        onOpenChange(false);
        return;
      }
      const created = await addBuilding({ name: name.trim(), buildingNumber: number.trim() });
      const storage = await addStorage({ buildingId: created.id, name: "Main Storage", locationSystemId: systemId });
      if (binCount > 0) await createBins(storage.id, binCount);
      onOpenChange(false);
      toast.success(`${created.name} is ready`);
      navigate(`/buildings/${created.id}`);
    } catch (err) {
      setError(errorMessage(err, "Couldn't save the building."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !saving && onOpenChange(next)}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={submit} className="flex flex-col gap-5">
          <DialogHeader>
            <DialogTitle>{isEdit ? "Rename Building" : "New Building"}</DialogTitle>
            <DialogDescription>
              {isEdit ? "Change how this building shows up in Bino." : "A building holds one grid of bins. You can add or remove bins later."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-[1fr_7rem] gap-3">
            <div className="flex flex-col gap-2">
              <Label htmlFor="building-name">Name</Label>
              <Input id="building-name" autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Workshop" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="building-number">Number</Label>
              <Input id="building-number" value={number} onChange={(e) => setNumber(e.target.value)} placeholder="Optional" />
            </div>
          </div>

          {!isEdit && (
            <>
              <fieldset className="flex flex-col gap-2">
                <legend className="mb-2 text-[13px] font-medium">Bin codes</legend>
                <div className="flex flex-col gap-1.5">
                  {systems.map((system) => {
                    const preview = generateLocationCode({ level: 0, row: 0, column: 0, position: 0 }, system);
                    const selected = system.id === systemId;
                    return (
                      <label
                        key={system.id}
                        className={cn(
                          "flex cursor-pointer items-center gap-3 rounded-2xl px-3.5 py-2.5 transition-[background-color,box-shadow] duration-150",
                          selected ? "bg-accent-blue/8 ring-1 ring-accent-blue/40" : "bg-field hover:bg-[color-mix(in_oklch,var(--field),var(--foreground)_3%)]"
                        )}
                      >
                        <input
                          type="radio"
                          name="system"
                          value={system.id}
                          checked={selected}
                          onChange={() => setSystemId(system.id)}
                          className="size-4 accent-(--accent-blue)"
                        />
                        <span className="flex min-w-0 flex-1 flex-col">
                          <span className="truncate text-[13px] font-medium">{system.name}</span>
                          <span className="truncate text-xs text-muted-foreground">
                            {system.levels.map((l) => l.name).join(" · ")}
                          </span>
                        </span>
                        <LocationTag code={preview} />
                      </label>
                    );
                  })}
                </div>
              </fieldset>

              <div className="flex items-center justify-between gap-4">
                <div className="flex flex-col">
                  <span className="text-[13px] font-medium">Starting bins</span>
                  <span className="text-xs text-muted-foreground">You can change this any time.</span>
                </div>
                <QuantityStepper value={binCount} onChange={(n) => setBinCount(Math.min(n, 200))} label="Starting bins" />
              </div>
            </>
          )}

          {error && <p role="alert" className="text-[13px] text-destructive">{error}</p>}

          <DialogFooter>
            <DialogClose render={<Button variant="outline" type="button" disabled={saving} />}>Cancel</DialogClose>
            <Button type="submit" disabled={saving || !name.trim()}>
              {saving ? "Saving…" : isEdit ? "Save" : "Create Building"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
