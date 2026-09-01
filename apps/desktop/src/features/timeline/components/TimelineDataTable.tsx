import { useMemo, useState } from "react";
import { type SortingState, flexRender } from "@tanstack/react-table";
import {
  type LegacyColumnDef as ColumnDef,
  getCoreRowModel,
  getSortedRowModel,
  useLegacyTable as useReactTable,
} from "@tanstack/react-table/legacy";
import type { MovementHistoryEvent, Bin, Storage } from "@bino/types";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@bino/ui";
import { HugeiconsIcon } from "@hugeicons/react";
import { Clock03Icon, ArrowUp01Icon, ArrowDown01Icon } from "@hugeicons/core-free-icons";

interface TimelineRow {
  event: MovementHistoryEvent;
  binName: string;
  buildingName?: string;
}

interface TimelineDataTableProps {
  events: MovementHistoryEvent[];
  bins: Bin[];
  storages: Storage[];
  /** Optional: resolve a buildingId to a display name (used on the all-buildings view) */
  getBuildingName?: (buildingId: string) => string | undefined;
}

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
    hour: "numeric",
    minute: "2-digit",
  });
};

const getMonthKey = (timestamp: string) => {
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
};

const getMonthLabel = (monthKey: string) => {
  const [year, month] = monthKey.split("-").map(Number);
  const date = new Date(year, month - 1, 1);
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
};

export const TimelineDataTable = ({
  events,
  bins,
  storages,
  getBuildingName,
}: TimelineDataTableProps) => {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "timestamp", desc: true },
  ]);

  const rows = useMemo<TimelineRow[]>(() => {
    return events.map((event) => {
      const bin = event.binId ? bins.find((b) => b.id === event.binId) : undefined;
      const storage = bin ? storages.find((s) => s.id === bin.storageId) : undefined;
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

  const columns = useMemo<ColumnDef<TimelineRow>[]>(() => {
    const cols: ColumnDef<TimelineRow>[] = [
      {
        id: "timestamp",
        header: "Timestamp",
        accessorFn: (row) => new Date(row.event.timestamp).getTime(),
        cell: ({ row }) => (
          <span className="text-muted-foreground whitespace-nowrap">
            {formatFullTimestamp(row.original.event.timestamp)}
          </span>
        ),
      },
      {
        id: "eventType",
        header: "Event",
        accessorFn: (row) => row.event.eventType,
        cell: ({ row }) => (
          <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
            <span>{getEventIcon(row.original.event.eventType)}</span>
            <span>{formatEventLabel(row.original.event.eventType)}</span>
          </span>
        ),
      },
      {
        id: "summary",
        header: "Summary",
        accessorFn: (row) => row.event.summary,
        cell: ({ row }) => (
          <span className="text-foreground">{row.original.event.summary}</span>
        ),
      },
      {
        id: "bin",
        header: "Bin",
        accessorFn: (row) => row.binName,
        cell: ({ row }) => (
          <span className="text-muted-foreground whitespace-nowrap">
            {row.original.binName}
          </span>
        ),
      },
    ];

    if (getBuildingName) {
      cols.push({
        id: "building",
        header: "Building",
        accessorFn: (row) => row.buildingName ?? "",
        cell: ({ row }) => (
          <span className="text-muted-foreground whitespace-nowrap">
            {row.original.buildingName ?? "—"}
          </span>
        ),
      });
    }

    return cols;
  }, [getBuildingName]);

  const table = useReactTable({
    data: rows,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const sortedRows = table.getRowModel().rows;

  // Group the already-sorted rows by month, preserving sort order within/between groups
  // only when the primary sort is by timestamp; for other sorts we skip grouping headers.
  const isTimestampSort = sorting[0]?.id === "timestamp";

  const groupedRows = useMemo(() => {
    if (!isTimestampSort) {
      return [{ monthKey: null as string | null, rows: sortedRows }];
    }

    const groups: { monthKey: string; rows: typeof sortedRows }[] = [];
    for (const row of sortedRows) {
      const key = getMonthKey(row.original.event.timestamp);
      const last = groups[groups.length - 1];
      if (last && last.monthKey === key) {
        last.rows.push(row);
      } else {
        groups.push({ monthKey: key, rows: [row] });
      }
    }
    return groups;
  }, [sortedRows, isTimestampSort]);

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-16 text-center rounded-2xl border border-dashed border-border bg-muted/20">
        <HugeiconsIcon
          icon={Clock03Icon}
          size={32}
          strokeWidth={1.5}
          className="text-muted-foreground/50 mb-3"
        />
        <p className="text-sm font-medium text-foreground">No activity yet</p>
        <p className="text-xs text-muted-foreground mt-1">
          Create ICNs and manage inventory to see activity here
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card/50 backdrop-blur-sm overflow-hidden">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="hover:bg-transparent">
              {headerGroup.headers.map((header) => {
                const sortDir = header.column.getIsSorted();
                return (
                  <TableHead
                    key={header.id}
                    className="uppercase tracking-wider text-xs font-medium cursor-pointer select-none"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    <span className="inline-flex items-center gap-1">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {sortDir === "asc" && (
                        <HugeiconsIcon icon={ArrowUp01Icon} size={14} strokeWidth={2} />
                      )}
                      {sortDir === "desc" && (
                        <HugeiconsIcon icon={ArrowDown01Icon} size={14} strokeWidth={2} />
                      )}
                    </span>
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {groupedRows.map((group) => (
            <>
              {group.monthKey && (
                <TableRow key={`month-${group.monthKey}`} className="hover:bg-transparent border-b-0">
                  <TableCell
                    colSpan={columns.length}
                    className="bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground py-2"
                  >
                    {getMonthLabel(group.monthKey)}
                  </TableCell>
                </TableRow>
              )}
              {group.rows.map((row) => (
                <TableRow key={row.id} className="hover:bg-accent/30">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
