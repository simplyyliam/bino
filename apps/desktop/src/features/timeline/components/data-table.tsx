import { useState } from "react";
import { useTable, type ColumnDef, type RowData } from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupButton,
  Button,
  cn,
} from "@bino/ui";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Search01Icon,
  Cancel01Icon,
  Delete02Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
} from "@hugeicons/core-free-icons";

import { features, type DataTableFeatures } from "../data-table-features";

interface DataTableProps<TData extends RowData> {
  columns: ColumnDef<DataTableFeatures, TData>[];
  data: TData[];
  emptyState?: React.ReactNode;
  /** Stable id per row — required for selection to survive paging/filtering. */
  getRowId?: (row: TData, index: number) => string;
  /** When provided, a Delete button appears next to Next while rows are selected. */
  onDeleteSelected?: (rows: TData[]) => void | Promise<void>;
  /** Noun used in the delete button label, e.g. "event" → "Delete 3 events". */
  deleteLabel?: string;
  searchPlaceholder?: string;
  /** Rendered to the right of the search field, e.g. a store filter dropdown. */
  toolbar?: React.ReactNode;
}

export function DataTable<TData extends RowData>({
  columns,
  data,
  emptyState,
  getRowId,
  onDeleteSelected,
  deleteLabel = "row",
  searchPlaceholder = "Filter events...",
  toolbar,
}: DataTableProps<TData>) {
  const [globalFilter, setGlobalFilter] = useState("");
  const [rowSelection, setRowSelection] = useState<Record<string, true>>({});
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const table = useTable(
    {
      features,
      data,
      columns,
      getRowId,
      state: {
        globalFilter,
        rowSelection,
      },
      onGlobalFilterChange: setGlobalFilter,
      onRowSelectionChange: setRowSelection,
      initialState: {
        pagination: {
          pageIndex: 0,
          pageSize: 10,
        },
      },
    },
    (state) => ({
      pagination: state.pagination,
      globalFilter: state.globalFilter,
      rowSelection: state.rowSelection,
      sorting: state.sorting,
    })
  );

  if (data.length === 0 && emptyState) {
    return <>{emptyState}</>;
  }

  const selectedRows = table.getSelectedRowModel().rows.map((row) => row.original);
  const pageCount = table.getPageCount();
  const currentPage = table.state.pagination.pageIndex + 1;
  const selectedCount = selectedRows.length;
  const filteredCount = table.getFilteredRowModel().rows.length;
  const totalCount = table.getCoreRowModel().rows.length;

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between gap-2">
        <InputGroup className="max-w-sm">
          <InputGroupAddon>
            <HugeiconsIcon icon={Search01Icon} strokeWidth={2} />
          </InputGroupAddon>

          <InputGroupInput
            placeholder={searchPlaceholder}
            value={globalFilter}
            onChange={(event) => setGlobalFilter(event.target.value)}
            aria-label={searchPlaceholder}
          />

          {globalFilter ? (
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                size="icon-xs"
                onClick={() => setGlobalFilter("")}
                aria-label="Clear search"
              >
                <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} />
              </InputGroupButton>
            </InputGroupAddon>
          ) : null}
        </InputGroup>

        {toolbar}
      </div>

      <div className="overflow-hidden rounded-md border">
        <div className="max-h-[600px] overflow-y-auto">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className={cn(
                        header.column.id === "select" && "w-8 pl-3"
                      )}
                    >
                      {header.isPlaceholder ? null : (
                        <table.FlexRender header={header} />
                      )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>

            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() ? "selected" : undefined}
                  >
                    {row.getAllCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className={cn(
                          cell.column.id === "select" && "w-8 pl-3"
                        )}
                      >
                        <table.FlexRender cell={cell} />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div className="text-sm text-muted-foreground">
          {deleteError ? (
            <span role="alert" className="text-destructive">
              {deleteError}
            </span>
          ) : selectedCount > 0 ? (
            `${selectedCount} of ${filteredCount} row(s) selected.`
          ) : (
            `${filteredCount} of ${totalCount} row(s)`
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="text-sm text-muted-foreground">
            Page {currentPage} of {pageCount}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <HugeiconsIcon
              icon={ArrowLeft01Icon}
              size={14}
              strokeWidth={2}
              data-icon="inline-start"
            />
            Previous
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
            <HugeiconsIcon
              icon={ArrowRight01Icon}
              size={14}
              strokeWidth={2}
              data-icon="inline-end"
            />
          </Button>

          {onDeleteSelected && selectedCount > 0 ? (
            <Button
              variant="destructive"
              size="sm"
              disabled={isDeleting}
              className="animate-in fade-in-0 slide-in-from-right-1 duration-150"
              onClick={async () => {
                setDeleteError(null);
                setIsDeleting(true);
                try {
                  await onDeleteSelected(selectedRows);
                  table.resetRowSelection(true);
                } catch (error) {
                  // Surface the failure instead of letting the rejected promise
                  // disappear, which made the button look like it did nothing.
                  console.error("Failed to delete selected rows:", error);
                  setDeleteError(
                    error instanceof Error ? error.message : "Failed to delete selected rows"
                  );
                } finally {
                  setIsDeleting(false);
                }
              }}
            >
              <HugeiconsIcon
                icon={Delete02Icon}
                size={14}
                strokeWidth={2}
                data-icon="inline-start"
              />
              {isDeleting ? "Deleting…" : `Delete ${selectedCount} ${deleteLabel}${selectedCount === 1 ? "" : "s"}`}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
