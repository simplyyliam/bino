import { useMemo, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  Button,
  InputGroup,
  InputGroupInput,
  InputGroupAddon,
} from "@bino/ui";
import { Search01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import Fuse from "fuse.js";
import { DynamicIcon } from "lucide-react/dynamic";
import { useBinStore } from "@bino/store";
import { IconButton } from "@/shared/components";
import { ICON_CATEGORIES, ALL_CATEGORY_ICONS } from "@/lib/icon-categories";
import { isValidIconName } from "@/lib/icons";
import { Image } from "lucide-react";

interface IconPickerProp {
  binId: string;
}

const ALL_CATEGORIES_VALUE = "all";

const fuse = new Fuse(
  ALL_CATEGORY_ICONS.map((name) => ({ name })),
  {
    keys: ["name"],
    threshold: 0.35,
  }
);

export const IconPicker = ({ binId }: IconPickerProp) => {
  const setBinIcon = useBinStore((s) => s.setBinIcon);
  const currentIcon = useBinStore((s) => s.bins.find((b) => b.id === binId)?.icon);

  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>(ALL_CATEGORIES_VALUE);

  const displayedIcons = useMemo(() => {
    if (search.trim()) {
      return fuse.search(search).slice(0, 60).map((r) => r.item.name);
    }
    if (activeCategory === ALL_CATEGORIES_VALUE) {
      return ALL_CATEGORY_ICONS;
    }
    return ICON_CATEGORIES.find((cat) => cat.label === activeCategory)?.icons ?? [];
  }, [search, activeCategory]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            className="flex h-20 w-20 items-center justify-center rounded-2xl bg-accent"
          >
            {isValidIconName(currentIcon) ? (
              <DynamicIcon name={currentIcon} strokeWidth={1.75} className="size-7!" />
            ) : (
              <Image className="size-7!" />
            )}
          </Button>
        }
      />
      <DropdownMenuContent className="w-80">
        <div className="flex flex-col gap-2 p-2">
          <InputGroup>
            <InputGroupInput
              placeholder="Search icons..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={(event) => event.stopPropagation()}
            />
            <InputGroupAddon>
              <HugeiconsIcon icon={Search01Icon} size={20} strokeWidth={1.67} />
            </InputGroupAddon>
          </InputGroup>
      
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Categories</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuRadioGroup value={activeCategory} onValueChange={setActiveCategory}>
                <DropdownMenuLabel>Filter by category</DropdownMenuLabel>
                <DropdownMenuRadioItem value={ALL_CATEGORIES_VALUE}>All</DropdownMenuRadioItem>
                {ICON_CATEGORIES.map((cat) => (
                  <DropdownMenuRadioItem key={cat.label} value={cat.label}>
                    {cat.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </div>
      
        <DropdownMenuSeparator />
      
        <div className="grid grid-cols-5 gap-1 max-h-80 overflow-y-auto p-1">
          {displayedIcons.map((name) => (
            <IconButton
              key={name}
              Icon={name}
              size={22}
              title={name}
              ariaLabel={name}
              onClick={() => setBinIcon(binId, name)}
              className="aspect-square w-full h-full"
            />
          ))}
        </div>
      
        {displayedIcons.length === 0 && (
          <p className="px-2 py-6 text-center text-sm text-muted-foreground">
            {search.trim() ? `No icons match "${search}"` : "No icons in this category"}
          </p>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
