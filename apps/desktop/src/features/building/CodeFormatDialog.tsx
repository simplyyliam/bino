import { useMemo, useState } from "react";
import { PlusIcon, Trash2Icon } from "lucide-react";
import type { Building, LocationMappingRule, LocationSystem, Storage } from "@bino/types";
import { defaultStoreNumber, generateLocationCode, nextStoreNumber, storeRuleIndex } from "@bino/data";
import { useBinStore, useLocationSystemStore, useStorageStore } from "@bino/store";
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
import { LocationTag } from "@/components/LocationTag";
import { errorMessage, plural } from "@/lib/format";

type Part = "fixed" | "store" | LocationMappingRule["canonicalField"];

const PART_OPTIONS: { value: Part; label: string }[] = [
  { value: "store", label: "Store number" },
  { value: "fixed", label: "Always the same" },
  { value: "row", label: "Shelf (down)" },
  { value: "column", label: "Column (across)" },
  { value: "level", label: "Floor level" },
  { value: "position", label: "Position in bin" },
];

// For the store part, `value` is this building's number and `formatValue` is
// what the format itself falls back to for buildings without one.
type Segment = { id: string; name: string; part: Part; value: number; formatValue?: number };

const toSegments = (system: LocationSystem, storeNumber: number | null | undefined): Segment[] => {
  const storeIndex = storeRuleIndex(system);
  return system.mappingRules.map((rule, i) => {
    const level = system.levels.find((l) => l.id === rule.levelId) ?? system.levels[i];
    const fixed = rule.fixedValue !== undefined && rule.fixedValue !== null;
    const base = { id: rule.levelId, name: level?.name ?? "" };
    if (i === storeIndex) {
      const formatValue = rule.fixedValue ?? rule.startValue ?? 1;
      return { ...base, part: "store", value: storeNumber ?? formatValue, formatValue };
    }
    return { ...base, part: fixed ? "fixed" : rule.canonicalField, value: fixed ? rule.fixedValue! : rule.startValue ?? 1 };
  });
};

const toSystem = (base: LocationSystem, segments: Segment[], patch: Partial<LocationSystem>): LocationSystem => ({
  ...base,
  ...patch,
  levels: segments.map((s, i) => ({ id: s.id, name: s.name || `Part ${i + 1}`, order: i, userManaged: true })),
  mappingRules: segments.map((s): LocationMappingRule => {
    if (s.part === "store") {
      const v = s.formatValue ?? s.value;
      return { levelId: s.id, canonicalField: "level", startValue: v, fixedValue: v, storeNumber: true };
    }
    return s.part === "fixed"
      ? { levelId: s.id, canonicalField: "level", startValue: s.value, fixedValue: s.value }
      : { levelId: s.id, canonicalField: s.part, startValue: s.value };
  }),
});

type CodeFormatDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  system: LocationSystem;
  storage: Storage;
  building: Building;
  sharedWith: Building[];
};

export function CodeFormatDialog(props: CodeFormatDialogProps) {
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <CodeFormatForm {...props} />
      </DialogContent>
    </Dialog>
  );
}

function CodeFormatForm({ onOpenChange, system, storage, building, sharedWith }: CodeFormatDialogProps) {
  const updateSystem = useLocationSystemStore((s) => s.updateLocationSystem);
  const addSystem = useLocationSystemStore((s) => s.addLocationSystem);
  const updateStorage = useStorageStore((s) => s.updateStorage);
  const storages = useStorageStore((s) => s.storages);
  const fetchBins = useBinStore((s) => s.fetchBins);

  const [name, setName] = useState(system.name);
  const [separator, setSeparator] = useState(system.separator);
  const [digits, setDigits] = useState(system.paddingWidth);
  const [segments, setSegments] = useState<Segment[]>(() => toSegments(system, storage.storeNumber));
  const [grid, setGrid] = useState(system.gridConfig ?? {});
  const [scope, setScope] = useState<"all" | "this">(sharedWith.length > 0 ? "this" : "all");
  const [saving, setSaving] = useState(false);

  const draft = useMemo(
    () => toSystem(system, segments, { name: name.trim() || system.name, separator, paddingWidth: digits, gridConfig: grid }),
    [system, segments, name, separator, digits, grid]
  );

  const storeSegment = segments.find((s) => s.part === "store");
  const storeValue = storeSegment?.value ?? null;
  const hadStorePart = storeRuleIndex(system) !== -1;

  const samples = useMemo(
    () => [
      { label: "First bin", code: generateLocationCode({ level: 0, row: 0, column: 0, position: 0 }, draft, storeValue) },
      { label: "One shelf down", code: generateLocationCode({ level: 0, row: 1, column: 0, position: 0 }, draft, storeValue) },
      { label: "Next column", code: generateLocationCode({ level: 0, row: 0, column: 1, position: 0 }, draft, storeValue) },
    ],
    [draft, storeValue]
  );

  // Another building on this same format already showing that store number?
  const forking = scope === "this" && sharedWith.length > 0;
  const others = useMemo(
    () => storages.filter((st) => st.locationSystemId === system.id && st.id !== storage.id),
    [storages, system.id, storage.id]
  );
  const clash = useMemo(() => {
    if (forking || storeValue === null || !hadStorePart) return undefined;
    const fallback = defaultStoreNumber(system);
    const taken = others.find((st) => (st.storeNumber ?? fallback) === storeValue);
    return taken ? sharedWith.find((b) => b.id === taken.buildingId)?.name ?? "another building" : undefined;
  }, [forking, storeValue, hadStorePart, others, system, sharedWith]);

  const changeSegment = (id: string, patch: Partial<Segment>) =>
    setSegments((list) =>
      list.map((s) => {
        if (s.id === id) {
          // Switching a part to "Store number" starts it on this building's next free number.
          if (patch.part === "store" && s.part !== "store") {
            return { ...s, ...patch, formatValue: s.value, value: nextStoreNumber(draft, others) ?? s.value };
          }
          return { ...s, ...patch };
        }
        // Only one store part per format.
        return patch.part === "store" && s.part === "store" ? { ...s, part: "fixed", value: s.formatValue ?? s.value } : s;
      })
    );

  const addStorePart = () =>
    setSegments((list) => [{ id: `lvl-${Date.now()}`, name: "Store", part: "store", value: 1, formatValue: 1 }, ...list]);

  const save = async () => {
    setSaving(true);
    try {
      const fields = { name: draft.name, separator, paddingWidth: digits, levels: draft.levels, mappingRules: draft.mappingRules, gridConfig: grid };
      const original = toSystem(system, toSegments(system, storage.storeNumber), {});
      const formatChanged =
        JSON.stringify([fields.name, separator, digits, draft.levels, draft.mappingRules, grid]) !==
        JSON.stringify([system.name, system.separator, system.paddingWidth, original.levels, original.mappingRules, system.gridConfig ?? {}]);

      if (!formatChanged) {
        if (storeValue !== null && storeValue !== storage.storeNumber) await updateStorage(storage.id, { storeNumber: storeValue });
      } else if (forking) {
        const copy = await addSystem({ ...fields, name: `${draft.name} (${building.name})`, usesExistingCodes: system.usesExistingCodes });
        await updateStorage(storage.id, { locationSystemId: copy.id, storeNumber: storeValue });
      } else {
        await updateSystem(system.id, fields);
        if (storeValue !== null && storeValue !== storage.storeNumber) {
          await updateStorage(storage.id, { storeNumber: storeValue });
        }
        // A store part just added to a shared format: give the other buildings
        // their own numbers too, otherwise they'd all share one.
        if (!hadStorePart && storeValue !== null) {
          let n = storeValue;
          for (const other of others) await updateStorage(other.id, { storeNumber: ++n });
        }
      }
      await fetchBins();
      toast.success("Bin codes updated");
      onOpenChange(false);
    } catch (err) {
      toast.error(errorMessage(err, "Couldn't save the code format."));
    } finally {
      setSaving(false);
    }
  };

  const perColumn = grid.racksPerColumn ?? 5;

  return (
    <>
        <DialogHeader>
          <DialogTitle>Bin Code Format</DialogTitle>
          <DialogDescription>Choose how the codes on your bin labels are built. Every bin gets its new code straight away.</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-2 rounded-xl bg-surface p-3">
          {samples.map((s) => (
            <div key={s.label} className="flex flex-col items-start gap-1.5">
              <span className="text-xs text-muted-foreground">{s.label}</span>
              <LocationTag code={s.code || "—"} className="bg-card" />
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="format-name">Name</Label>
          <Input id="format-name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-[13px] font-medium">Parts of the code, left to right</legend>
          <div className="flex flex-col gap-2">
            {segments.map((seg, i) => (
              <div key={seg.id} className="grid grid-cols-[1.5rem_1fr_1fr_5rem_2rem] items-center gap-2">
                <span className="text-right text-xs text-muted-foreground tabular-nums">{i + 1}</span>
                <Input aria-label="Part name" value={seg.name} onChange={(e) => changeSegment(seg.id, { name: e.target.value })} placeholder="e.g. Shelf" />
                <NativeSelect aria-label="How it changes" value={seg.part} onChange={(e) => changeSegment(seg.id, { part: e.target.value as Part })}>
                  {PART_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </NativeSelect>
                <Input
                  aria-label={seg.part === "store" ? `${building.name}'s store number` : seg.part === "fixed" ? "Number" : "Starts at"}
                  title={seg.part === "store" ? `${building.name}'s store number` : seg.part === "fixed" ? "Number" : "Starts at"}
                  aria-invalid={seg.part === "store" && !!clash}
                  inputMode="numeric"
                  value={String(seg.value)}
                  onChange={(e) => changeSegment(seg.id, { value: Number(e.target.value.replace(/[^\d]/g, "")) || 0 })}
                  className="text-center tabular-nums"
                />
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-muted-foreground"
                  aria-label={`Remove ${seg.name || "part"}`}
                  disabled={segments.length <= 1}
                  onClick={() => setSegments((list) => list.filter((s) => s.id !== seg.id))}
                >
                  <Trash2Icon />
                </Button>
              </div>
            ))}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="self-start text-accent-blue hover:text-accent-blue"
            onClick={() => setSegments((list) => [...list, { id: `lvl-${Date.now()}`, name: "", part: "fixed", value: 1 }])}
          >
            <PlusIcon /> Add a Part
          </Button>
          {storeSegment ? (
            <p className={cn("text-xs", clash ? "text-destructive" : "text-muted-foreground")}>
              {clash
                ? `Store ${storeValue} is already used by ${clash}. Pick another number.`
                : `The store number belongs to ${building.name}. Other buildings keep their own, so codes never repeat.`}
            </p>
          ) : (
            <div className="flex items-center justify-between gap-3 rounded-xl bg-surface px-3.5 py-2.5">
              <p className="text-xs text-muted-foreground">No store part, so these codes can match another building's.</p>
              <Button variant="outline" size="xs" onClick={addStorePart}>
                Add a Store Part
              </Button>
            </div>
          )}
        </fieldset>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="format-sep">Between parts</Label>
            <Input id="format-sep" value={separator} maxLength={3} onChange={(e) => setSeparator(e.target.value)} className="text-center font-mono" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="format-digits">Digits</Label>
            <NativeSelect id="format-digits" value={digits} onChange={(e) => setDigits(Number(e.target.value))}>
              {[1, 2, 3, 4].map((d) => <option key={d} value={d}>{d} ({"1".padStart(d, "0")})</option>)}
            </NativeSelect>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="format-rows">Shelf labels</Label>
            <Input id="format-rows" value={grid.rowPrefix ?? ""} onChange={(e) => setGrid((g) => ({ ...g, rowPrefix: e.target.value }))} placeholder="e.g. L" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="format-cols">Column labels</Label>
            <Input id="format-cols" value={grid.columnPrefix ?? ""} onChange={(e) => setGrid((g) => ({ ...g, columnPrefix: e.target.value }))} placeholder="None" />
          </div>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col">
            <span className="text-[13px] font-medium">Bins per column</span>
            <span className="text-xs text-muted-foreground">How tall each column is. Existing bins stay where they are.</span>
          </div>
          <Input
            aria-label="Bins per column"
            inputMode="numeric"
            value={String(perColumn)}
            onChange={(e) => setGrid((g) => ({ ...g, racksPerColumn: Math.max(1, Math.min(50, Number(e.target.value.replace(/[^\d]/g, "")) || 1)) }))}
            className="w-20 text-center tabular-nums"
          />
        </div>

        {sharedWith.length > 0 && (
          <fieldset className="flex flex-col gap-2 rounded-xl bg-surface p-3.5">
            <legend className="sr-only">Apply to</legend>
            <p className="text-[13px]">
              {sharedWith.map((b) => b.name).join(", ")} {sharedWith.length === 1 ? "uses" : "use"} this format too.
            </p>
            {(["this", "all"] as const).map((value) => (
              <label key={value} className={cn("flex cursor-pointer items-center gap-2.5 text-[13px]")}>
                <input type="radio" name="scope" checked={scope === value} onChange={() => setScope(value)} className="size-4 accent-(--accent-blue)" />
                {value === "this" ? `Just ${building.name}` : `All ${plural(sharedWith.length + 1, "building")}`}
              </label>
            ))}
          </fieldset>
        )}

        <DialogFooter>
          <DialogClose render={<Button variant="outline" disabled={saving} />}>Cancel</DialogClose>
          <Button onClick={() => void save()} disabled={saving || segments.length === 0 || !!clash}>
            {saving ? "Saving…" : "Save Format"}
          </Button>
        </DialogFooter>
    </>
  );
}
