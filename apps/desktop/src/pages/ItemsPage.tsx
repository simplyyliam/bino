import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Fuse from "fuse.js";
import { ArrowDownIcon, ArrowUpIcon, DownloadIcon, EllipsisIcon, PackageIcon, PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";
import type { Item } from "@bino/types";
import { useItemStore } from "@bino/store";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  NativeSelect,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  cn,
  toast,
} from "@bino/ui";
import { Page, PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { LocationTag } from "@/components/LocationTag";
import { SearchField } from "@/components/SearchField";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { ItemDialog } from "@/features/items/ItemDialog";
import { binLink, isLow, useInventory } from "@/lib/inventory";
import { exportItemsCsv } from "@/lib/exports";
import { errorMessage, formatNumber, plural } from "@/lib/format";

type Show = "all" | "attention" | "unplaced";
type Sort = { key: "name" | "total"; dir: 1 | -1 };

type Row = {
  item: Item;
  total: number;
  places: { binId: string; buildingId: string; buildingName: string; code: string; quantity: number }[];
  state: "ok" | "low" | "out" | "unplaced";
};

export default function ItemsPage() {
  const inv = useInventory();
  const deleteItem = useItemStore((s) => s.deleteItem);
  const [params, setParams] = useSearchParams();
  const query = params.get("q") ?? "";
  const [category, setCategory] = useState("");
  const [show, setShow] = useState<Show>("all");
  const [sort, setSort] = useState<Sort>({ key: "name", dir: 1 });
  const [editing, setEditing] = useState<Item | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<Row | null>(null);

  const setQuery = (q: string) =>
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      if (q) next.set("q", q);
      else next.delete("q");
      return next;
    }, { replace: true });

  const rows = useMemo<Row[]>(() => {
    return inv.items.map((item) => {
      const lines = inv.binItems.filter((bi) => bi.itemId === item.id);
      const places = lines.flatMap((line) => {
        const bin = inv.summaries.get(line.binId)?.bin;
        const building = inv.buildingForBin(line.binId);
        return bin && building
          ? [{ binId: bin.id, buildingId: building.id, buildingName: building.name, code: bin.locationCode, quantity: line.quantity }]
          : [];
      });
      const total = lines.reduce((sum, l) => sum + l.quantity, 0);
      const state: Row["state"] =
        lines.length === 0 ? "unplaced" : total === 0 || lines.some((l) => l.quantity === 0) ? "out" : lines.some(isLow) ? "low" : "ok";
      return { item, total, places, state };
    });
  }, [inv]);

  const categories = useMemo(() => [...new Set(inv.items.map((i) => i.category).filter(Boolean) as string[])].sort(), [inv.items]);
  const fuse = useMemo(() => new Fuse(rows, { keys: ["item.name", "item.category", "item.description"], threshold: 0.35, ignoreLocation: true }), [rows]);

  const visible = useMemo(() => {
    let list = query.trim() ? fuse.search(query.trim()).map((r) => r.item) : rows;
    if (category) list = list.filter((r) => r.item.category === category);
    if (show === "attention") list = list.filter((r) => r.state === "low" || r.state === "out");
    if (show === "unplaced") list = list.filter((r) => r.state === "unplaced");
    if (!query.trim() || sort.key !== "name" || sort.dir !== 1) {
      list = [...list].sort((a, b) =>
        sort.key === "name" ? a.item.name.localeCompare(b.item.name) * sort.dir : (a.total - b.total) * sort.dir
      );
    }
    return list;
  }, [rows, fuse, query, category, show, sort]);

  const totalUnits = rows.reduce((sum, r) => sum + r.total, 0);

  const toggleSort = (key: Sort["key"]) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === 1 ? -1 : 1 } : { key, dir: key === "total" ? -1 : 1 }));

  const SortIcon = ({ k }: { k: Sort["key"] }) =>
    sort.key === k ? (sort.dir === 1 ? <ArrowUpIcon className="size-3" /> : <ArrowDownIcon className="size-3" />) : null;

  const remove = async (row: Row) => {
    try {
      await deleteItem(row.item.id);
      toast.success(`${row.item.name} deleted`);
    } catch (err) {
      toast.error(errorMessage(err, "Couldn't delete the item."));
    }
  };

  return (
    <Page>
      <PageHeader
        title="Items"
        description={`${plural(rows.length, "item")} · ${formatNumber(totalUnits)} in stock`}
        actions={
          <>
            <Button variant="outline" onClick={() => exportItemsCsv(inv)} disabled={rows.length === 0}>
              <DownloadIcon /> Export CSV
            </Button>
            <Button onClick={() => setCreating(true)}>
              <PlusIcon /> New Item
            </Button>
          </>
        }
      />

      {rows.length === 0 ? (
        <div className="rounded-2xl bg-card shadow-card">
          <EmptyState
            icon={PackageIcon}
            title="No items yet"
            description="Open a building and click a bin to start adding what's in it."
            action={<Button variant="outline" render={<Link to="/" />}>Go to Overview</Button>}
          />
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <SearchField value={query} onChange={setQuery} placeholder="Search items" className="w-72" />
            <NativeSelect value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Category" className="w-48">
              <option value="">All categories</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </NativeSelect>
            <NativeSelect value={show} onChange={(e) => setShow(e.target.value as Show)} aria-label="Show" className="w-48">
              <option value="all">All items</option>
              <option value="attention">Low or out of stock</option>
              <option value="unplaced">Not in any bin</option>
            </NativeSelect>
            <span className="ml-auto text-xs text-muted-foreground tabular-nums">
              {visible.length !== rows.length && `${visible.length} of ${rows.length}`}
            </span>
          </div>

          <div className="overflow-hidden rounded-xl bg-card shadow-card">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>
                    <button type="button" onClick={() => toggleSort("name")} className="flex items-center gap-1 hover:text-foreground">
                      Item <SortIcon k="name" />
                    </button>
                  </TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Where it is</TableHead>
                  <TableHead className="text-right">
                    <button type="button" onClick={() => toggleSort("total")} className="ml-auto flex items-center gap-1 hover:text-foreground">
                      <SortIcon k="total" /> Total
                    </button>
                  </TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.length === 0 && (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={5} className="py-12 text-center text-muted-foreground">
                      No items match these filters.
                    </TableCell>
                  </TableRow>
                )}
                {visible.map((row) => (
                  <TableRow key={row.item.id}>
                    <TableCell className="max-w-72">
                      <div className="flex flex-col">
                        <span className="truncate font-medium">{row.item.name}</span>
                        {row.item.description && <span className="truncate text-xs text-muted-foreground">{row.item.description}</span>}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{row.item.category ?? "—"}</TableCell>
                    <TableCell>
                      {row.places.length === 0 ? (
                        <span className="text-xs text-muted-foreground">Not in any bin</span>
                      ) : (
                        <div className="flex flex-wrap items-center gap-1">
                          {row.places.slice(0, 3).map((p) => (
                            <Tooltip key={p.binId}>
                              <TooltipTrigger
                                render={
                                  <Link to={binLink(p.buildingId, p.binId)} className="rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring">
                                    <LocationTag code={p.code} className="h-6 transition-colors hover:border-foreground/25 hover:bg-accent" />
                                  </Link>
                                }
                              />
                              <TooltipContent>{p.buildingName} · {formatNumber(p.quantity)} here</TooltipContent>
                            </Tooltip>
                          ))}
                          {row.places.length > 3 && <span className="text-xs text-muted-foreground">+{row.places.length - 3}</span>}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={cn(
                          "font-semibold tabular-nums",
                          row.state === "low" && "text-bin-low-fg",
                          row.state === "out" && "text-bin-out-fg"
                        )}
                      >
                        {row.state === "unplaced" ? "—" : formatNumber(row.total)}
                      </span>
                      {(row.state === "low" || row.state === "out") && (
                        <span className="ml-1.5 text-xs text-muted-foreground">{row.state === "low" ? "Low" : "Out"}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button variant="ghost" size="icon-xs" className="text-muted-foreground" aria-label={`${row.item.name} options`}>
                              <EllipsisIcon />
                            </Button>
                          }
                        />
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem onClick={() => setEditing(row.item)}>
                            <PencilIcon /> Edit…
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem variant="destructive" onClick={() => setDeleting(row)}>
                            <Trash2Icon /> Delete Item…
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      <ItemDialog open={creating || editing !== null} onOpenChange={(o) => { if (!o) { setCreating(false); setEditing(null); } }} item={editing ?? undefined} />
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={`Delete “${deleting?.item.name}”?`}
        description={
          deleting && deleting.places.length > 0
            ? `It'll be removed from ${plural(deleting.places.length, "bin")}, along with any ICNs. This can't be undone.`
            : "This can't be undone."
        }
        confirmLabel="Delete Item"
        onConfirm={() => deleting && remove(deleting)}
      />
    </Page>
  );
}
