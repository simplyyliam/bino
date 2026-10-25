import { useMemo, useState } from "react";
import Fuse from "fuse.js";
import { PlusIcon, SearchIcon } from "lucide-react";
import type { Bin } from "@bino/types";
import { useItemStore } from "@bino/store";
import { Button, Popover, PopoverContent, PopoverTrigger, cn, toast } from "@bino/ui";
import { errorMessage } from "@/lib/format";
import { CreateItemDialog } from "./CreateItemDialog";

export function AddItemButton({ bin }: { bin: Bin }) {
  const items = useItemStore((s) => s.items);
  const binItems = useItemStore((s) => s.binItems);
  const addItemToBin = useItemStore((s) => s.addItemToBin);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [creating, setCreating] = useState<string | null>(null);

  const inBin = useMemo(() => new Set(binItems.filter((bi) => bi.binId === bin.id).map((bi) => bi.itemId)), [binItems, bin.id]);
  const fuse = useMemo(() => new Fuse(items, { keys: ["name", "category"], threshold: 0.35 }), [items]);
  const results = useMemo(() => {
    const q = query.trim();
    const list = q ? fuse.search(q, { limit: 30 }).map((r) => r.item) : [...items].sort((a, b) => a.name.localeCompare(b.name));
    return list.slice(0, 30);
  }, [query, fuse, items]);

  // The last row is always "Create …".
  const rowCount = results.length + 1;

  const close = () => {
    setOpen(false);
    setQuery("");
    setActive(0);
  };

  const add = async (itemId: string, name: string) => {
    close();
    try {
      const { merged } = await addItemToBin(bin.id, itemId);
      toast(merged ? `Added 1 more ${name}` : `Added ${name}`);
    } catch (err) {
      toast.error(errorMessage(err, "Couldn't add the item."));
    }
  };

  const startCreate = () => {
    setCreating(query.trim());
    close();
  };

  return (
    <>
      <Popover open={open} onOpenChange={(o) => (o ? setOpen(true) : close())}>
        <PopoverTrigger
          render={
            <Button variant="ghost" size="xs" className="-mr-2 text-primary hover:text-primary">
              <PlusIcon /> Add Item
            </Button>
          }
        />
        <PopoverContent align="end" className="w-80 p-0">
          <div className="flex items-center gap-2 border-b border-border px-3">
            <SearchIcon className="size-4 text-muted-foreground" />
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
                  setActive((i) => Math.min(i + 1, rowCount - 1));
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setActive((i) => Math.max(i - 1, 0));
                } else if (e.key === "Enter") {
                  e.preventDefault();
                  const pick = results[active];
                  if (pick) void add(pick.id, pick.name);
                  else startCreate();
                }
              }}
              placeholder="Search items or type a new one"
              aria-label="Search items"
              className="h-11 flex-1 bg-transparent text-[13px] outline-none placeholder:text-muted-foreground"
            />
          </div>
          <div role="listbox" className="max-h-64 overflow-y-auto p-1 scrollbar-thin">
            {results.map((item, i) => (
              <button
                key={item.id}
                type="button"
                role="option"
                aria-selected={i === active}
                onMouseMove={() => setActive(i)}
                onClick={() => void add(item.id, item.name)}
                className={cn("flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left", i === active && "bg-accent")}
              >
                <span className="min-w-0 flex-1 truncate text-[13px]">{item.name}</span>
                {inBin.has(item.id) ? (
                  <span className="text-xs text-muted-foreground">In this bin</span>
                ) : (
                  item.category && <span className="truncate text-xs text-muted-foreground">{item.category}</span>
                )}
              </button>
            ))}
            {results.length === 0 && query.trim() && (
              <p className="px-2.5 py-2 text-xs text-muted-foreground">No items called “{query.trim()}” yet.</p>
            )}
          </div>
          <div className="border-t border-border p-1">
            <button
              type="button"
              onMouseMove={() => setActive(results.length)}
              onClick={startCreate}
              className={cn(
                "flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[13px] font-medium text-primary",
                active === results.length && "bg-accent"
              )}
            >
              <PlusIcon className="size-4" />
              {query.trim() ? <>Create “{query.trim()}”…</> : "Create New Item…"}
            </button>
          </div>
        </PopoverContent>
      </Popover>

      <CreateItemDialog
        open={creating !== null}
        onOpenChange={(o) => !o && setCreating(null)}
        initialName={creating ?? ""}
        bin={bin}
      />
    </>
  );
}
