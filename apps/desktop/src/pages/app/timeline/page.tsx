import { useMemo } from "react";
import {
  useMovementHistoryStore,
  useBinStore,
  useStorageStore,
  useBuildingStore,
  useTimelineFilterStore,
} from "@bino/store";
import { TimelineDataTable } from "@/features/timeline";

export default function TimelinePage() {
  const selectedBuildingId = useTimelineFilterStore((s) => s.selectedBuildingId);
  const setSelectedBuildingId = useTimelineFilterStore((s) => s.setSelectedBuildingId);

  const history = useMovementHistoryStore((s) => s.history);
  const deleteHistoryEvents = useMovementHistoryStore((s) => s.deleteHistoryEvents);
  const bins = useBinStore((s) => s.bins);
  const storages = useStorageStore((s) => s.storages);
  const buildings = useBuildingStore((s) => s.buildings);

  const buildingNameById = useMemo(
    () => new Map(buildings.map((b) => [b.id, b.name])),
    [buildings]
  );

  const events = useMemo(() => {
    if (!selectedBuildingId) return history;

    const storageIds = new Set(
      storages.filter((s) => s.buildingId === selectedBuildingId).map((s) => s.id)
    );
    const binIds = new Set(bins.filter((b) => storageIds.has(b.storageId)).map((b) => b.id));

    return history.filter((event) => event.binId && binIds.has(event.binId));
  }, [history, storages, bins, selectedBuildingId]);

  return (
    <div className="container mx-auto px-6 py-10 max-w-6xl">
      <div className="flex flex-col gap-1 mb-8">
        <h1 className="text-3xl font-bold tracking-tight">
          {selectedBuildingId ? buildingNameById.get(selectedBuildingId) ?? "Building" : "All Activity"}
        </h1>
        <p className="text-muted-foreground">
          Full history of inventory movements and events
        </p>
      </div>

      <TimelineDataTable
        events={events}
        bins={bins}
        storages={storages}
        getBuildingName={selectedBuildingId ? undefined : (id) => buildingNameById.get(id)}
        buildings={buildings}
        selectedBuildingId={selectedBuildingId}
        onSelectedBuildingChange={setSelectedBuildingId}
        onDeleteEvents={(eventsToDelete) =>
          deleteHistoryEvents(eventsToDelete.map((e) => e.id))
        }
      />
    </div>
  );
}
