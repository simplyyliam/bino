import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Fuse from "fuse.js";
import { BoxIcon, Building2Icon, PackageIcon, SearchIcon, TagIcon, type LucideIcon } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, Kbd, cn } from "@bino/ui";
import { useSearchStore } from "@bino/store";
import { binLink, binTitle, useInventory } from "@/lib/inventory";
import { formatNumber, modKey } from "@/lib/format";
import { LocationTag } from "./LocationTag";

type Result = {
  key: string;
  group: "Items" | "Bins" | "ICNs" | "Buildings";
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  code?: string;
  meta?: string;
  href: string;
  search: string;
};

const GROUP_ORDER: Result["group"][] = ["Items", "ICNs", "Bins", "Buildings"];

function useSearchIndex() {
  const inv = useInventory();

  return useMemo(() => {
    const results: Result[] = [];
    const placeOf = (binId: string) => {
      const summary = inv.summaries.get(binId);
      const building = inv.buildingForBin(binId);
      return summary && building ? { bin: summary.bin, building } : undefined;
    };

    for (const item of inv.items) {
      const lines = inv.binItems.filter((bi) => bi.itemId === item.id);
      const search = [item.name, item.category, item.description].filter(Boolean).join(" ");
      if (lines.length === 0) {
        results.push({
          key: `item-${item.id}`,
          group: "Items",
          icon: PackageIcon,
          title: item.name,
          subtitle: "Not in any bin",
          href: `/items?q=${encodeURIComponent(item.name)}`,
          search,
        });
      }
      for (const line of lines) {
        const place = placeOf(line.binId);
        if (!place) continue;
        results.push({
          key: `line-${line.id}`,
          group: "Items",
          icon: PackageIcon,
          title: item.name,
          subtitle: place.building.name,
          code: place.bin.locationCode,
          meta: formatNumber(line.quantity),
          href: binLink(place.building.id, place.bin.id),
          search,
        });
      }
    }

    for (const icn of inv.icns) {
      const line = inv.binItems.find((bi) => bi.icnId === icn.id);
      const place = line ? placeOf(line.binId) : undefined;
      results.push({
        key: `icn-${icn.id}`,
        group: "ICNs",
        icon: TagIcon,
        title: icn.value,
        subtitle: inv.itemsById.get(icn.itemId)?.name,
        code: place?.bin.locationCode,
        href: `/icn/${encodeURIComponent(icn.value)}`,
        search: icn.value,
      });
    }

    for (const { bin } of inv.summaries.values()) {
      const place = placeOf(bin.id);
      if (!place) continue;
      results.push({
        key: `bin-${bin.id}`,
        group: "Bins",
        icon: BoxIcon,
        title: binTitle(bin),
        subtitle: place.building.name,
        code: bin.locationCode,
        href: binLink(place.building.id, bin.id),
        search: `${bin.locationCode} ${bin.name}`,
      });
    }

    for (const building of inv.buildings) {
      results.push({
        key: `building-${building.id}`,
        group: "Buildings",
        icon: Building2Icon,
        title: building.name,
        subtitle: building.buildingNumber ? `Building ${building.buildingNumber}` : undefined,
        href: `/buildings/${building.id}`,
        search: `${building.name} ${building.buildingNumber}`,
      });
    }

    return {
      results,
      buildings: results.filter((r) => r.group === "Buildings"),
      fuse: new Fuse(results, { keys: ["search"], threshold: 0.32, ignoreLocation: true }),
    };
  }, [inv]);
}

export function SearchCommand() {
  const open = useSearchStore((s) => s.open);
  const setOpen = useSearchStore((s) => s.setOpen);
  const navigate = useNavigate();
  const index = useSearchIndex();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = e.target instanceof HTMLElement && e.target.closest("input, textarea, select, [contenteditable]");
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !typing)) {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setOpen]);

  const results = useMemo(() => {
    const q = query.trim();
    if (!q) return index.buildings;
    const found = index.fuse.search(q, { limit: 40 }).map((r) => r.item);
    return GROUP_ORDER.flatMap((group) => found.filter((r) => r.group === group));
  }, [query, index]);

  useEffect(() => {
    listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const go = (result?: Result) => {
    if (!result) return;
    setOpen(false);
    setQuery("");
    setActive(0);
    navigate(result.href);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setQuery("");
          setActive(0);
        }
      }}
    >
      <DialogContent showCloseButton={false} className="top-[18%] translate-y-0 gap-0 overflow-hidden p-0 sm:max-w-xl">
        <DialogTitle className="sr-only">Search</DialogTitle>
        <div className="flex items-center gap-3 border-b border-border px-4">
          <SearchIcon className="size-4 shrink-0 text-muted-foreground" />
          <input
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive((i) => Math.min(i + 1, results.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((i) => Math.max(i - 1, 0));
              } else if (e.key === "Enter") {
                e.preventDefault();
                go(results[active]);
              }
            }}
            placeholder="Find an item, ICN, bin code or building…"
            className="h-13 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            aria-label="Search"
          />
          <Kbd>Esc</Kbd>
        </div>

        <div ref={listRef} className="max-h-[min(26rem,60vh)] overflow-y-auto p-1.5 scrollbar-thin" role="listbox">
          {results.length === 0 ? (
            <p className="px-3 py-10 text-center text-[13px] text-muted-foreground">
              {query.trim() ? <>Nothing matches “{query.trim()}”.</> : "No buildings yet."}
            </p>
          ) : (
            results.map((r, i) => {
              const showGroup = i === 0 || results[i - 1].group !== r.group;
              const Icon = r.icon;
              return (
                <div key={r.key}>
                  {showGroup && (
                    <div className="px-2.5 pt-2.5 pb-1 text-xs font-medium text-muted-foreground">
                      {query.trim() ? r.group : "Jump to"}
                    </div>
                  )}
                  <button
                    type="button"
                    role="option"
                    aria-selected={i === active}
                    data-index={i}
                    onMouseMove={() => setActive(i)}
                    onClick={() => go(r)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left",
                      i === active && "bg-accent"
                    )}
                  >
                    <Icon className="size-4 shrink-0 text-muted-foreground" strokeWidth={1.75} />
                    <span className="flex min-w-0 flex-1 items-baseline gap-2">
                      <span className="truncate text-[13px] font-medium">{r.title}</span>
                      {r.subtitle && <span className="truncate text-xs text-muted-foreground">{r.subtitle}</span>}
                    </span>
                    {r.code && <LocationTag code={r.code} className="h-5 text-[11px]" />}
                    {r.meta && (
                      <span className="w-10 shrink-0 text-right text-xs font-medium text-muted-foreground tabular-nums">
                        {r.meta}
                      </span>
                    )}
                  </button>
                </div>
              );
            })
          )}
        </div>

        <div className="flex items-center gap-4 border-t border-border bg-surface/60 px-4 py-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5"><Kbd>↑</Kbd><Kbd>↓</Kbd> to move</span>
          <span className="flex items-center gap-1.5"><Kbd>↵</Kbd> to open</span>
          <span className="ml-auto flex items-center gap-1.5"><Kbd>{modKey}</Kbd><Kbd>K</Kbd> anywhere</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
