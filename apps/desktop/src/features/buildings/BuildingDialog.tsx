import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Building } from "@bino/types";
import { defaultStoreNumber, generateLocationCode, nextStoreNumber, storeRuleIndex } from "@bino/data";
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
import { BuildingPreview } from "./BuildingPreview";

type BuildingDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Pass a building to rename it; leave empty to create a new one.
  building?: Building;
};

export function BuildingDialog(props: BuildingDialogProps) {
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className={props.building ? "sm:max-w-lg" : "gap-0 p-0 sm:max-w-3xl"}>
        <BuildingForm {...props} />
      </DialogContent>
    </Dialog>
  );
}

const ORIGIN = { level: 0, row: 0, column: 0, position: 0 };

function BuildingForm({ onOpenChange, building }: BuildingDialogProps) {
  const navigate = useNavigate();
  const addBuilding = useBuildingStore((s) => s.addBuilding);
  const updateBuilding = useBuildingStore((s) => s.updateBuilding);
  const deleteBuilding = useBuildingStore((s) => s.deleteBuilding);
  const buildings = useBuildingStore((s) => s.buildings);
  const storages = useStorageStore((s) => s.storages);
  const addStorage = useStorageStore((s) => s.addStorage);
  const createBins = useBinStore((s) => s.createBinsInStorage);
  const systems = useLocationSystemStore((s) => s.locationSystems);

  // Next free store number per format, so every new building gets its own codes.
  const nextNumbers = useMemo(
    () => new Map(systems.map((sys) => [sys.id, nextStoreNumber(sys, storages.filter((st) => st.locationSystemId === sys.id))])),
    [systems, storages]
  );

  const [name, setName] = useState(building?.name ?? "");
  const [number, setNumber] = useState(building?.buildingNumber ?? "");
  const [systemId, setSystemId] = useState(systems[0]?.id ?? "");
  const [storeNumber, setStoreNumber] = useState(() => String(nextNumbers.get(systems[0]?.id ?? "") ?? ""));
  const [binCount, setBinCount] = useState(20);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEdit = !!building;
  const system = systems.find((s) => s.id === systemId);
  const hasStorePart = !!system && storeRuleIndex(system) !== -1;
  const parsedStore = Number.parseInt(storeNumber, 10);
  const chosenStore = hasStorePart && !Number.isNaN(parsedStore) ? parsedStore : null;

  // Catch a duplicate before anything is created.
  const clash = useMemo(() => {
    if (!system || chosenStore === null) return undefined;
    const fallback = defaultStoreNumber(system);
    const taken = storages.find((st) => st.locationSystemId === system.id && (st.storeNumber ?? fallback) === chosenStore);
    return taken ? buildings.find((b) => b.id === taken.buildingId)?.name ?? "another building" : undefined;
  }, [system, chosenStore, storages, buildings]);

  const pickSystem = (id: string) => {
    setSystemId(id);
    setStoreNumber(String(nextNumbers.get(id) ?? ""));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setError("Give the building a name.");
    if (clash) return setError(`Store ${chosenStore} is already used by ${clash}. Pick another number.`);
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
      try {
        const storage = await addStorage({ buildingId: created.id, name: "Main Storage", locationSystemId: systemId, storeNumber: chosenStore });
        if (binCount > 0) await createBins(storage.id, binCount);
      } catch (err) {
        // Don't leave a half-made building behind.
        await deleteBuilding(created.id).catch(() => undefined);
        throw err;
      }
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
    <form onSubmit={submit} className={cn(!isEdit && "grid sm:grid-cols-[minmax(0,1fr)_19rem]")}>
      <div className={cn("flex flex-col gap-5", !isEdit && "p-6")}>
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
                {systems.map((sys) => {
                  const selected = sys.id === systemId;
                  const preview = generateLocationCode(ORIGIN, sys, selected ? chosenStore : nextNumbers.get(sys.id));
                  return (
                    <label
                      key={sys.id}
                      className={cn(
                        "flex cursor-pointer items-center gap-3 rounded-2xl px-3.5 py-2.5 transition-[background-color,box-shadow] duration-150",
                        selected ? "bg-accent-blue/8 ring-1 ring-accent-blue/40" : "bg-field hover:bg-[color-mix(in_oklch,var(--field),var(--foreground)_3%)]"
                      )}
                    >
                      <input
                        type="radio"
                        name="system"
                        value={sys.id}
                        checked={selected}
                        onChange={() => pickSystem(sys.id)}
                        className="size-4 accent-(--accent-blue)"
                      />
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate text-[13px] font-medium">{sys.name}</span>
                        <span className="truncate text-xs text-muted-foreground">{sys.levels.map((l) => l.name).join(" · ")}</span>
                      </span>
                      <LocationTag code={preview} />
                    </label>
                  );
                })}
              </div>
            </fieldset>

            {hasStorePart ? (
              <div className="flex items-center justify-between gap-4">
                <div className="flex flex-col">
                  <Label htmlFor="store-number">Store number</Label>
                  <span className="mt-1 text-xs text-muted-foreground">
                    {clash ? <span className="text-destructive">Already used by {clash}</span> : "The next free number, so codes stay unique."}
                  </span>
                </div>
                <Input
                  id="store-number"
                  inputMode="numeric"
                  value={storeNumber}
                  onChange={(e) => setStoreNumber(e.target.value.replace(/[^\d]/g, ""))}
                  aria-invalid={!!clash}
                  className="w-20 text-center tabular-nums"
                />
              </div>
            ) : (
              <p className="rounded-xl bg-surface px-3.5 py-2.5 text-xs text-muted-foreground">
                This format has no store part, so its codes can match another building's. You can add one later in Bin Code Format.
              </p>
            )}

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
          <Button type="submit" disabled={saving || !name.trim() || !!clash}>
            {saving ? "Saving…" : isEdit ? "Save" : "Create Building"}
          </Button>
        </DialogFooter>
      </div>

      {!isEdit && (
        <div className="hidden overflow-hidden rounded-r-[22px] sm:block">
          <BuildingPreview
            name={name}
            number={number}
            system={system}
            firstCode={system ? generateLocationCode(ORIGIN, system, chosenStore) : ""}
            binCount={binCount}
          />
        </div>
      )}
    </form>
  );
}
