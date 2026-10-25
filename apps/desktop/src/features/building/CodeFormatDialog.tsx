import { useEffect, useMemo, useState } from "react";
import { PlusIcon, Trash2Icon } from "lucide-react";
import type { Building, LocationMappingRule, LocationSystem, Storage } from "@bino/types";
import { generateLocationCode } from "@bino/data";
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

type Part = "fixed" | LocationMappingRule["canonicalField"];

const PART_OPTIONS: { value: Part; label: string }[] = [
  { value: "fixed", label: "Always the same" },
  { value: "row", label: "Shelf (down)" },
  { value: "column", label: "Column (across)" },
  { value: "level", label: "Floor level" },
  { value: "position", label: "Position in bin" },
];

type Segment = { id: string; name: string; part: Part; value: number };

const toSegments = (system: LocationSystem): Segment[] =>
  system.levels.map((level, i) => {
    const rule = system.mappingRules.find((r) => r.levelId === level.id) ?? system.mappingRules[i];
    const fixed = rule?.fixedValue !== undefined && rule?.fixedValue !== null;
    return {
      id: level.id,
      name: level.name,
      part: fixed ? "fixed" : rule?.canonicalField ?? "row",
      value: fixed ? rule!.fixedValue! : rule?.startValue ?? 1,
    };
  });

const toSystem = (base: LocationSystem, segments: Segment[], patch: Partial<LocationSystem>): LocationSystem => ({
  ...base,
  ...patch,
  levels: segments.map((s, i) => ({ id: s.id, name: s.name || `Part ${i + 1}`, order: i, userManaged: true })),
  mappingRules: segments.map((s) =>
    s.part === "fixed"
      ? { levelId: s.id, canonicalField: "level", startValue: s.value, fixedValue: s.value }
      : { levelId: s.id, canonicalField: s.part, startValue: s.value }
  ),
});

type CodeFormatDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  system: LocationSystem;
  storage: Storage;
  building: Building;
  sharedWith: Building[];
};

export function CodeFormatDialog({ open, onOpenChange, system, storage, building, sharedWith }: CodeFormatDialogProps) {
  const updateSystem = useLocationSystemStore((s) => s.updateLocationSystem);
  const addSystem = useLocationSystemStore((s) => s.addLocationSystem);
  const updateStorage = useStorageStore((s) => s.updateStorage);
  const fetchBins = useBinStore((s) => s.fetchBins);

  const [name, setName] = useState(system.name);
  const [separator, setSeparator] = useState(system.separator);
  const [digits, setDigits] = useState(system.paddingWidth);
  const [segments, setSegments] = useState<Segment[]>(() => toSegments(system));
  const [grid, setGrid] = useState(system.gridConfig ?? {});
  const [scope, setScope] = useState<"all" | "this">("all");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(system.name);
    setSeparator(system.separator);
    setDigits(system.paddingWidth);
    setSegments(toSegments(system));
    setGrid(system.gridConfig ?? {});
    setScope(sharedWith.length > 0 ? "this" : "all");
  }, [open, system, sharedWith.length]);

  const draft = useMemo(
    () => toSystem(system, segments, { name: name.trim() || system.name, separator, paddingWidth: digits, gridConfig: grid }),
    [system, segments, name, separator, digits, grid]
  );

  const samples = useMemo(
    () => [
      { label: "First bin", code: generateLocationCode({ level: 0, row: 0, column: 0, position: 0 }, draft) },
      { label: "One shelf down", code: generateLocationCode({ level: 0, row: 1, column: 0, position: 0 }, draft) },
      { label: "Next column", code: generateLocationCode({ level: 0, row: 0, column: 1, position: 0 }, draft) },
    ],
    [draft]
  );

  const changeSegment = (id: string, patch: Partial<Segment>) =>
    setSegments((list) => list.map((s) => (s.id === id ? { ...s, ...patch } : s)));

  const save = async () => {
    setSaving(true);
    try {
      const fields = { name: draft.name, separator, paddingWidth: digits, levels: draft.levels, mappingRules: draft.mappingRules, gridConfig: grid };
      if (scope === "this" && sharedWith.length > 0) {
        const copy = await addSystem({ ...fields, name: `${draft.name} (${building.name})`, usesExistingCodes: system.usesExistingCodes });
        await updateStorage(storage.id, { locationSystemId: copy.id });
      } else {
        await updateSystem(system.id, fields);
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
    <Dialog open={open} onOpenChange={(o) => !saving && onOpenChange(o)}>
      <DialogContent className="sm:max-w-xl">
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
                  aria-label={seg.part === "fixed" ? "Number" : "Starts at"}
                  title={seg.part === "fixed" ? "Number" : "Starts at"}
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
          <Button onClick={() => void save()} disabled={saving || segments.length === 0}>
            {saving ? "Saving…" : "Save Format"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
