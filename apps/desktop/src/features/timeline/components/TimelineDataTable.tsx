import { useMemo } from "react";
import type { MovementHistoryEvent, Bin, Storage } from "@bino/types";
import { HugeiconsIcon } from "@hugeicons/react";
import { Clock03Icon } from "@hugeicons/core-free-icons";

import { createTimelineColumns, type TimelineEvent } from "../columns";
import { DataTable } from "./data-table";

interface TimelineDataTableProps {
  events: MovementHistoryEvent[];
  bins: Bin[];
  storages: Storage[];
  /** Optional: resolve a buildingId to a display name */
  getBuildingName?: (buildingId: string) => string | undefined;
}

export const TimelineDataTable = ({
  events,
  bins,
  storages,
  getBuildingName,
}: TimelineDataTableProps) => {
  const rows = useMemo<TimelineEvent[]>(() => {
    return events.map((event) => {
      const bin = event.binId
        ? bins.find((b) => b.id === event.binId)
        : undefined;

      const storage = bin
        ? storages.find((s) => s.id === bin.storageId)
        : undefined;

      const buildingName = storage
        ? getBuildingName?.(storage.buildingId) ?? storage.buildingId
        : undefined;

      return {
        event,
        binName: bin ? bin.name || bin.locationCode : "—",
        buildingName,
      };
    });
  }, [events, bins, storages, getBuildingName]);

  const columns = useMemo(
    () => createTimelineColumns(!!getBuildingName),
    [getBuildingName]
  );

  const emptyState = (
    <div className="flex h-112.5 flex-col items-center justify-center rounded-md border border-dashed">
      <HugeiconsIcon
        icon={Clock03Icon}
        size={48}
        strokeWidth={1.5}
        className="mb-4 text-muted-foreground/50"
      />

      <h3 className="text-lg font-semibold">No activity yet</h3>

      <p className="mt-1 text-sm text-muted-foreground">
        Create ICNs and manage inventory to see activity here
      </p>
    </div>
  );

  return <DataTable columns={columns} data={rows} emptyState={emptyState} />;
}