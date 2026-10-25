import { useMemo, useState } from "react";
import Fuse from "fuse.js";
import { ImagePlusIcon, SearchIcon } from "lucide-react";
import type { IconName } from "lucide-react/dynamic";
import { useBinStore } from "@bino/store";
import { NativeSelect, Popover, PopoverContent, PopoverTrigger, Tooltip, TooltipContent, TooltipTrigger, cn, toast } from "@bino/ui";
import { BinIcon } from "@/components/BinIcon";
import { ALL_CATEGORY_ICONS, ICON_CATEGORIES } from "@/lib/icon-categories";
import { isValidIconName } from "@/lib/icons";
import { errorMessage } from "@/lib/format";

const ALL = "all";
const fuse = new Fuse(ALL_CATEGORY_ICONS.map((name) => ({ name })), { keys: ["name"], threshold: 0.35 });

export function IconPicker({ binId, icon }: { binId: string; icon?: string | null }) {
  const setBinIcon = useBinStore((s) => s.setBinIcon);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState(ALL);

  const icons = useMemo(() => {
    if (search.trim()) return fuse.search(search.trim(), { limit: 60 }).map((r) => r.item.name);
    if (category === ALL) return ALL_CATEGORY_ICONS;
    return ICON_CATEGORIES.find((c) => c.label === category)?.icons ?? [];
  }, [search, category]);

  const choose = (name: IconName | null) => {
    setOpen(false);
    setBinIcon(binId, name).catch((err) => toast.error(errorMessage(err, "Couldn't change the icon.")));
  };

  const hasIcon = isValidIconName(icon);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <button
            type="button"
            aria-label={hasIcon ? "Change icon" : "Add an icon"}
            className={cn(
              "flex size-12 shrink-0 items-center justify-center rounded-xl transition-[background-color,scale] duration-150 outline-none focus-visible:ring-3 focus-visible:ring-ring active:scale-[0.95]",
              hasIcon ? "bg-surface text-foreground hover:bg-accent" : "border-[1.5px] border-dashed border-border text-muted-foreground hover:bg-accent"
            )}
          >
            {hasIcon ? <BinIcon iconName={icon} size={22} /> : <ImagePlusIcon className="size-5" strokeWidth={1.75} />}
          </button>
        }
      />
      <PopoverContent className="w-80 p-0">
        <div className="flex flex-col gap-2 border-b border-border p-2">
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search icons"
              aria-label="Search icons"
              className="h-9 w-full rounded-lg bg-surface pr-3 pl-8.5 text-[13px] outline-none placeholder:text-muted-foreground focus:ring-3 focus:ring-ring/40"
            />
          </div>
          {!search.trim() && (
            <NativeSelect value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Icon category">
              <option value={ALL}>All categories</option>
              {ICON_CATEGORIES.map((c) => (
                <option key={c.label} value={c.label}>{c.label}</option>
              ))}
            </NativeSelect>
          )}
        </div>
        <div className="grid max-h-64 grid-cols-7 gap-1 overflow-y-auto p-2 scrollbar-thin">
          {icons.filter(isValidIconName).map((name) => (
            <Tooltip key={name}>
              <TooltipTrigger
                render={
                  <button
                    type="button"
                    onClick={() => choose(name)}
                    aria-label={name}
                    className={cn(
                      "flex aspect-square items-center justify-center rounded-lg text-foreground/80 transition-colors duration-100 hover:bg-accent hover:text-foreground",
                      icon === name && "bg-primary/10 text-primary"
                    )}
                  >
                    <BinIcon iconName={name} size={18} />
                  </button>
                }
              />
              <TooltipContent>{name.replace(/-/g, " ")}</TooltipContent>
            </Tooltip>
          ))}
          {icons.length === 0 && <p className="col-span-7 py-6 text-center text-[13px] text-muted-foreground">No icons match.</p>}
        </div>
        {hasIcon && (
          <div className="border-t border-border p-1">
            <button type="button" onClick={() => choose(null)} className="w-full rounded-lg px-2.5 py-2 text-left text-[13px] text-muted-foreground hover:bg-accent hover:text-foreground">
              Remove Icon
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
