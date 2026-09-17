import { useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import {
  useMovementHistoryStore,
  useBinStore,
  useStorageStore,
  useBuildingStore,
} from "@bino/store";
import { TimelineDataTable } from "@/features/timeline";
import { IconButton } from "@/shared/components";

export default function BuildingTimelinePage() {
  const { buildingId } = useParams<{ buildingId: string }>();
  const navigate = useNavigate();

  const history = useMovementHistoryStore((s) => s.history);
  const deleteHistoryEvents = useMovementHistoryStore((s) => s.deleteHistoryEvents);
  const bins = useBinStore((s) => s.bins);
  const storages = useStorageStore((s) => s.storages);
  const buildings = useBuildingStore((s) => s.buildings);

  const building = buildings.find((b) => b.id === buildingId);

  const events = useMemo(() => {
    const storageIds = new Set(
      storages.filter((s) => s.buildingId === buildingId).map((s) => s.id)
    );
    const binIds = new Set(bins.filter((b) => storageIds.has(b.storageId)).map((b) => b.id));

    return history.filter((event) => event.binId && binIds.has(event.binId));
  }, [history, storages, bins, buildingId]);

  return (
    <div className="min-h-screen bg-linear-to-br from-background via-accent/5 to-background">
      <div className="container mx-auto px-6 py-10 max-w-6xl">
        <IconButton variant="ghost" onClick={() => navigate(-1)} Icon={ArrowLeft01Icon}/>

        <div className="flex flex-col gap-2 mb-8">
          <h1>
            {building?.name ?? "Building"} Timeline
          </h1>
          <p className="text-muted-foreground">
            Full history of inventory movements and events for this building
          </p>
        </div>

        <TimelineDataTable
          events={events}
          bins={bins}
          storages={storages}
          onDeleteEvents={(eventsToDelete) =>
            deleteHistoryEvents(eventsToDelete.map((e) => e.id))
          }
        />
      </div>
    </div>
  );
}
