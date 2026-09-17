import { useMemo } from "react";
import type { MovementHistoryEvent, Bin, Storage, Building } from "@bino/types";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@bino/ui";
import { HugeiconsIcon } from "@hugeicons/react";
import { Clock03Icon, Building06Icon, ArrowDown01Icon } from "@hugeicons/core-free-icons";

import { createTimelineColumns, type TimelineEvent } from "../columns";
import { DataTable } from "./data-table";

interface TimelineDataTableProps {
  events: MovementHistoryEvent[];
  bins: Bin[];
  storages: Storage[];
  /** Optional: resolve a buildingId to a display name */
  getBuildingName?: (buildingId: string) => string | undefined;
  /** Optional: when provided, selecting rows reveals a Delete button */
  onDeleteEvents?: (events: MovementHistoryEvent[]) => void | Promise<void>;
  /** All buildings ("stores") available to filter by. Omit to hide the filter. */
  buildings?: Building[];
  /** Currently selected building id, or null/undefined for "All Stores". */
  selectedBuildingId?: string | null;
  onSelectedBuildingChange?: (buildingId: string | null) => void;
}

const ALL_STORES_VALUE = "__all__";

export const TimelineDataTable = ({
  events,
  bins,
  storages,
  getBuildingName,
  onDeleteEvents,
  buildings,
  selectedBuildingId,
  onSelectedBuildingChange,
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

  const selectedBuilding = buildings?.find((b) => b.id === selectedBuildingId);

  const storeFilter = buildings ? (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" size="sm">
            <HugeiconsIcon icon={Building06Icon} size={14} strokeWidth={2} data-icon="inline-start" />
            {selectedBuilding ? selectedBuilding.name : "All Stores"}
            <HugeiconsIcon icon={ArrowDown01Icon} size={14} strokeWidth={2} data-icon="inline-end" />
          </Button>
        }
      />

      <DropdownMenuContent align="end">
        <DropdownMenuRadioGroup
          value={selectedBuildingId ?? ALL_STORES_VALUE}
          onValueChange={(value) =>
            onSelectedBuildingChange?.(value === ALL_STORES_VALUE ? null : value)
          }
        >
          <DropdownMenuRadioItem value={ALL_STORES_VALUE}>
            All Stores
          </DropdownMenuRadioItem>

          {buildings.map((building) => (
            <DropdownMenuRadioItem key={building.id} value={building.id}>
              {building.name}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  ) : undefined;

  return (
    <DataTable
      columns={columns}
      data={rows}
      emptyState={emptyState}
      getRowId={(row) => row.event.id}
      searchPlaceholder="Filter events..."
      deleteLabel="event"
      toolbar={storeFilter}
      onDeleteSelected={
        onDeleteEvents
          ? (selected) => onDeleteEvents(selected.map((row) => row.event))
          : undefined
      }
    />
  );
}