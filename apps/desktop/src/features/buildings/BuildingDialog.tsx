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
  NativeSelect,
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

export function BuildingDialog(props: BuildingDialogProps) {
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="sm:max-w-[30rem]">
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

  const firstCode = system ? generateLocationCode(ORIGIN, system, chosenStore) : "";

  return (
    <form onSubmit={submit} className="flex flex-col gap-5">
      <DialogHeader>
        <DialogTitle>{isEdit ? "Rename Building" : "New Building"}</DialogTitle>
        <DialogDescription>
          {isEdit ? "Change how this building shows up in Bino." : "A building holds one grid of bins. You can change any of this later."}
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-col gap-2">
        <Row label="Name" htmlFor="building-name">
          <Input id="building-name" autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Workshop" />
        </Row>
        <Row label="Number" htmlFor="building-number">
          <Input id="building-number" value={number} onChange={(e) => setNumber(e.target.value)} placeholder="Optional" className="w-28" />
        </Row>

        {!isEdit && (
          <>
            <Row label="Codes" htmlFor="building-format">
              <NativeSelect id="building-format" value={systemId} onChange={(e) => pickSystem(e.target.value)} className="min-w-0 flex-1">
                {systems.map((sys) => (
                  <option key={sys.id} value={sys.id}>
                    {sys.name}
                  </option>
                ))}
              </NativeSelect>
            </Row>
            <Row label="Store" htmlFor="store-number">
              {hasStorePart ? (
                <>
                  <Input
                    id="store-number"
                    inputMode="numeric"
                    value={storeNumber}
                    onChange={(e) => setStoreNumber(e.target.value.replace(/[^\d]/g, ""))}
                    aria-invalid={!!clash}
                    aria-describedby="store-number-hint"
                    className="w-16 text-center tabular-nums"
                  />
                  <span id="store-number-hint" className={cn("text-xs", clash ? "text-destructive" : "text-muted-foreground")}>
                    {clash ? `Already used by ${clash}` : "Next free number, so codes stay unique"}
                  </span>
                </>
              ) : (
                <span className="text-xs text-muted-foreground">This format has no store part, so codes can match another building's.</span>
              )}
            </Row>
            <Row label="Bins">
              <QuantityStepper value={binCount} onChange={(n) => setBinCount(Math.min(n, 200))} label="Starting bins" />
              <span className="text-xs text-muted-foreground">to start with</span>
            </Row>
          </>
        )}
      </div>

      {error && <p role="alert" className="text-[13px] text-destructive">{error}</p>}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        {!isEdit && firstCode ? (
          <span className="flex min-w-0 items-center gap-2 text-xs whitespace-nowrap text-muted-foreground">
            First bin
            <LocationTag code={firstCode} />
          </span>
        ) : (
          <span />
        )}
        <DialogFooter className="shrink-0">
          <DialogClose render={<Button variant="outline" type="button" disabled={saving} />}>Cancel</DialogClose>
          <Button type="submit" loading={saving} disabled={!name.trim() || !!clash}>
            {saving ? "Saving…" : isEdit ? "Save" : "Create Building"}
          </Button>
        </DialogFooter>
      </div>
    </form>
  );
}

// One line of the form: a quiet label on the left, the controls on the right.
function Row({ label, htmlFor, children }: { label: string; htmlFor?: string; children: React.ReactNode }) {
  const Tag = htmlFor ? Label : "span";
  return (
    <div className="flex min-h-9 items-center gap-3">
      <Tag htmlFor={htmlFor} className="w-16 shrink-0 text-[13px] font-normal text-muted-foreground">
        {label}
      </Tag>
      <div className="flex min-w-0 flex-1 items-center gap-2.5">{children}</div>
    </div>
  );
}
