import { createColumnHelper } from "@tanstack/react-table";
import type { MovementHistoryEvent } from "@bino/types";

import { type DataTableFeatures } from "./data-table-features";

// Shape of each row in the timeline table
export type TimelineEvent = {
  event: MovementHistoryEvent;
  binName: string;
  buildingName?: string;
};

const getEventIcon = (eventType: string) => {
  switch (eventType) {
    case "icn_created":
      return "✨";
    case "item_added_to_bin":
      return "📦";
    case "item_removed_from_bin":
      return "📤";
    case "item_moved_between_bins":
      return "🔄";
    case "quantity_increased":
      return "📈";
    case "quantity_decreased":
      return "📉";
    case "marked_out_of_stock":
      return "⚠️";
    case "marked_out_of_service":
      return "🔧";
    case "marked_serviceable":
      return "✅";
    default:
      return "•";
  }
};

const formatEventLabel = (eventType: string) => {
  return eventType
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const formatFullTimestamp = (timestamp: string) => {
  const date = new Date(timestamp);

  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

const formatSummary = (summary: string) => summary.replace(/^ICN (ICN-)/, "$1");

const columnHelper = createColumnHelper<DataTableFeatures, TimelineEvent>();

export const createTimelineColumns = (includeBuilding: boolean) =>
  columnHelper.columns([
    columnHelper.accessor((row) => new Date(row.event.timestamp).getTime(), {
      id: "timestamp",
      header: "Timestamp",
      cell: ({ row }) => (
        <div className="text-sm text-muted-foreground">
          {formatFullTimestamp(row.original.event.timestamp)}
        </div>
      ),
    }),

    columnHelper.accessor((row) => row.event.eventType, {
      id: "eventType",
      header: "Event",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span
            className="flex size-7 shrink-0 items-center justify-center rounded-md border bg-muted/50 text-xs"
            aria-hidden="true"
          >
            {getEventIcon(row.original.event.eventType)}
          </span>

          <span className="text-sm font-medium">
            {formatEventLabel(row.original.event.eventType)}
          </span>
        </div>
      ),
    }),

    columnHelper.accessor((row) => row.event.summary, {
      id: "summary",
      header: "Summary",
      cell: ({ row }) => <div className="text-sm">{formatSummary(row.original.event.summary)}</div>
    }),

    columnHelper.accessor((row) => row.binName, {
      id: "bin",
      header: "Bin",
      cell: ({ row }) => (
        <div className="font-mono text-xs text-muted-foreground">
          {row.original.binName}
        </div>
      ),
    }),

    ...(includeBuilding
      ? [
          columnHelper.accessor((row) => row.buildingName ?? "", {
            id: "building",
            header: "Building",
            cell: ({ row }) => (
              <div className="text-sm text-muted-foreground">
                {row.original.buildingName ?? "—"}
              </div>
            ),
          }),
        ]
      : []),
  ]);
