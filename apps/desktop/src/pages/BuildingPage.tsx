import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { BoxesIcon, ChevronLeftIcon, EllipsisIcon, LayoutGridIcon } from "lucide-react";
import { useLocationSystemStore, useStorageStore } from "@bino/store";
import { Button, toast } from "@bino/ui";
import { EmptyState } from "@/components/EmptyState";
import { SearchField } from "@/components/SearchField";
import { BuildingActions } from "@/features/buildings/BuildingActions";
import { BinGrid } from "@/features/building/BinGrid";
import { BinInspector } from "@/features/building/BinInspector";
import { BuildingSwitcher } from "@/features/building/BuildingSwitcher";
import { LayoutDialog } from "@/features/building/LayoutDialog";
import { StatusFilter } from "@/features/building/StatusFilter";
import { CodeFormatDialog } from "@/features/building/CodeFormatDialog";
import { countStatuses, useInventory, type BinStatus, type BinSummary } from "@/lib/inventory";
import { errorMessage, plural } from "@/lib/format";
import NotFoundPage from "./NotFoundPage";

const pad = (n: number) => String(n).padStart(2, "0");

export default function BuildingPage() {
  const { buildingId = "" } = useParams();
  const [params, setParams] = useSearchParams();
  const inv = useInventory();
  const systems = useLocationSystemStore((s) => s.locationSystems);
  const addStorage = useStorageStore((s) => s.addStorage);

  const [filter, setFilter] = useState<BinStatus | null>(null);
  const [query, setQuery] = useState("");
  const [layoutOpen, setLayoutOpen] = useState(false);
  const [codesOpen, setCodesOpen] = useState(false);

  const building = inv.buildingsById.get(buildingId);
  const storage = inv.storageByBuilding.get(buildingId);
  const system = systems.find((s) => s.id === storage?.locationSystemId);
  const bins = useMemo(() => (storage ? inv.binsByStorage.get(storage.id) ?? [] : []), [inv, storage]);
  const summaries = useMemo(() => bins.map((b) => inv.summaries.get(b.id)!).filter(Boolean), [bins, inv]);
  const counts = useMemo(() => countStatuses(summaries), [summaries]);

  const selectedId = params.get("bin");
  const selected = selectedId ? inv.summaries.get(selectedId) : undefined;
  const selectedHere = selected && selected.bin.storageId === storage?.id ? selected : undefined;

  const select = useCallback(
    (binId: string | null) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (binId) next.set("bin", binId);
          else next.delete("bin");
          return next;
        },
        { replace: true }
      );
    },
    [setParams]
  );

  // Bring a deep-linked bin (e.g. from search) into view.
  useEffect(() => {
    if (!selectedId) return;
    document.querySelector(`[data-bin="${selectedId}"]`)?.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "smooth" });
  }, [selectedId]);

  useEffect(() => {
    if (!selectedId) return;
    const onKey = (e: KeyboardEvent) => {
      const inField = e.target instanceof HTMLElement && e.target.closest("input, textarea, select, [role=dialog], [role=menu]");
      if (e.key === "Escape" && !inField) select(null);
    };
    // Capture phase, so a bin's tooltip can't swallow the Escape first.
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [selectedId, select]);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    const ids = new Set<string>();
    for (const s of summaries) {
      const haystack = [
        s.bin.locationCode,
        s.bin.name,
        ...s.items.map((i) => inv.itemsById.get(i.itemId)?.name ?? ""),
        ...s.items.map((i) => (i.icnId ? inv.icnsById.get(i.icnId)?.value ?? "" : "")),
      ]
        .join(" ")
        .toLowerCase();
      if (haystack.includes(q)) ids.add(s.bin.id);
    }
    return ids;
  }, [query, summaries, inv]);

  if (!building) {
    return <NotFoundPage title="Building not found" description="It may have been deleted." />;
  }

  const rows = Math.max(system?.gridConfig?.racksPerColumn ?? 5, ...bins.map((b) => b.row + 1));
  const columns = Math.max(1, (storage?.maxColumn ?? 0) + 1, ...bins.map((b) => b.column + 1));
  const rowPrefix = system?.gridConfig?.rowPrefix ?? "R";
  const colPrefix = system?.gridConfig?.columnPrefix ?? "";

  const isDimmed = (s: BinSummary) => (filter !== null && s.status !== filter) || (matches !== null && !matches.has(s.bin.id));
  const isHighlighted = (s: BinSummary) => matches !== null && matches.has(s.bin.id);
  const itemNames = (s: BinSummary) => s.items.map((i) => inv.itemsById.get(i.itemId)?.name ?? "Unknown item");

  const setUpStorage = async () => {
    try {
      await addStorage({ buildingId: building.id, name: "Main Storage", locationSystemId: systems[0]?.id ?? "" });
      setLayoutOpen(true);
    } catch (err) {
      toast.error(errorMessage(err, "Couldn't set up the bins."));
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex flex-col gap-4 px-6 pt-6 pb-4 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="flex min-w-0 flex-col gap-0.5">
              <Link to="/" className="flex w-fit items-center gap-0.5 text-xs font-medium text-muted-foreground hover:text-foreground">
                <ChevronLeftIcon className="size-3.5" /> Overview
              </Link>
              <BuildingSwitcher current={building} buildings={inv.buildings} />
              <p className="text-[13px] text-muted-foreground">
                {[building.buildingNumber && `Building ${building.buildingNumber}`, plural(bins.length, "bin"), system?.name]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {storage && (
                <Button variant="outline" onClick={() => setLayoutOpen(true)}>
                  <LayoutGridIcon /> Edit Layout
                </Button>
              )}
              <BuildingActions
                building={building}
                trigger={
                  <Button variant="outline" size="icon" aria-label="More options">
                    <EllipsisIcon />
                  </Button>
                }
              />
            </div>
          </div>

          {bins.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <StatusFilter counts={counts} total={bins.length} value={filter} onChange={setFilter} />
              <SearchField value={query} onChange={setQuery} placeholder="Find in this building" />
            </div>
          )}
          {matches && (
            <p className="-mt-1 text-xs text-muted-foreground" aria-live="polite">
              {matches.size ? `${plural(matches.size, "bin")} match “${query.trim()}”` : `No bins match “${query.trim()}”`}
            </p>
          )}
        </div>

      <div className="mx-4 mb-4 flex min-h-0 flex-1 overflow-hidden rounded-[20px] bg-background shadow-card lg:mx-6 lg:mb-6">
        <div className="min-h-0 min-w-0 flex-1 overflow-auto scrollbar-thin">
          {!storage ? (
            <EmptyState
              icon={BoxesIcon}
              title="No bin grid yet"
              description="Set up the bins for this building to start tracking what's in them."
              action={<Button onClick={setUpStorage}>Set Up Bins</Button>}
            />
          ) : bins.length === 0 ? (
            <EmptyState
              icon={BoxesIcon}
              title="No bins yet"
              description="Add bins to match the shelves in this building."
              action={<Button onClick={() => setLayoutOpen(true)}>Add Bins</Button>}
            />
          ) : (
            <BinGrid
              summaries={summaries}
              rows={rows}
              columns={columns}
              rowLabel={(i) => `${rowPrefix}${pad(i + 1)}`}
              columnLabel={(i) => `${colPrefix}${pad(i + 1)}`}
              selectedId={selectedHere?.bin.id ?? null}
              onSelect={(id) => select(id === selectedId ? null : id)}
              isDimmed={isDimmed}
              isHighlighted={isHighlighted}
              itemNames={itemNames}
            />
          )}
        </div>

        {selectedHere && (
          <BinInspector summary={selectedHere} building={building} inv={inv} onClose={() => select(null)} />
        )}
      </div>

      {storage && (
        <LayoutDialog
          open={layoutOpen}
          onOpenChange={setLayoutOpen}
          storage={storage}
          bins={bins}
          system={system}
          inv={inv}
          onEditCodes={() => {
            setLayoutOpen(false);
            setCodesOpen(true);
          }}
        />
      )}
      {storage && system && (
        <CodeFormatDialog
          open={codesOpen}
          onOpenChange={setCodesOpen}
          system={system}
          storage={storage}
          building={building}
          sharedWith={inv.buildings.filter(
            (b) => b.id !== building.id && inv.storageByBuilding.get(b.id)?.locationSystemId === system.id
          )}
        />
      )}
    </div>
  );
}
