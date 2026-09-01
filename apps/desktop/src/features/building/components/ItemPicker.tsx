import { useState, useMemo } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  Button,
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
} from "@bino/ui";
import { Search01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useItemStore } from "@bino/store";
import Fuse from "fuse.js";

interface ItemPickerProps {
  onSelect: (itemId: string, itemName: string) => void;
}

export const ItemPicker = ({ onSelect }: ItemPickerProps) => {
  const items = useItemStore((s) => s.items);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);

  const fuse = useMemo(
    () =>
      new Fuse(items, {
        keys: ["name", "description", "category"],
        threshold: 0.35,
      }),
    [items]
  );

  const displayedItems = useMemo(() => {
    if (search.trim()) {
      return fuse.search(search).slice(0, 50).map((r) => r.item);
    }
    return items;
  }, [search, items, fuse]);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger render={<Button size="sm">+ Assign Item</Button>} />
      <DropdownMenuContent className="w-80">
        <div className="flex flex-col gap-2 p-2">
          <InputGroup>
            <InputGroupInput
              placeholder="Search items..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={(event) => event.stopPropagation()}
            />
            <InputGroupAddon>
              <HugeiconsIcon icon={Search01Icon} size={20} strokeWidth={1.67} />
            </InputGroupAddon>
          </InputGroup>
        </div>

        <div className="max-h-80 overflow-y-auto">
          {displayedItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                onSelect(item.id, item.name);
                setOpen(false);
              }}
              className="w-full px-3 py-2 text-left hover:bg-accent transition-colors flex flex-col gap-0.5"
            >
              <span className="text-sm font-medium">{item.name}</span>
              {item.description && (
                <span className="text-xs text-muted-foreground">{item.description}</span>
              )}
              {item.category && (
                <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
                  {item.category}
                </span>
              )}
            </button>
          ))}
        </div>

        {displayedItems.length === 0 && (
          <p className="px-3 py-6 text-center text-sm text-muted-foreground">
            {search.trim() ? `No items match "${search}"` : "No items available"}
          </p>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
