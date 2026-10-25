import { forwardRef } from "react";
import { WrenchIcon } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger, cn } from "@bino/ui";
import { BinIcon } from "@/components/BinIcon";
import { binTitle, statusLabel, type BinStatus, type BinSummary } from "@/lib/inventory";
import { formatNumber } from "@/lib/format";
import { isValidIconName } from "@/lib/icons";

const tone: Record<BinStatus, string> = {
  empty: "border-[1.5px] border-dashed border-bin-empty text-muted-foreground hover:border-foreground/30 hover:bg-accent/60",
  stocked: "bg-bin-stocked text-bin-stocked-fg hover:shadow-[inset_0_0_0_1.5px_oklch(0_0_0/0.1)]",
  low: "bg-bin-low text-bin-low-fg hover:shadow-[inset_0_0_0_1.5px_oklch(0_0_0/0.1)]",
  out: "bg-bin-out text-bin-out-fg hover:shadow-[inset_0_0_0_1.5px_oklch(0_0_0/0.1)]",
  service: "bg-bin-service bg-hatch text-bin-service-fg hover:shadow-[inset_0_0_0_1.5px_oklch(0_0_0/0.1)]",
};

type BinTileProps = {
  summary: BinSummary;
  itemNames: string[];
  selected: boolean;
  dimmed: boolean;
  highlighted: boolean;
  tabIndex: number;
  onSelect: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLButtonElement>) => void;
};

export const BinTile = forwardRef<HTMLButtonElement, BinTileProps>(function BinTile(
  { summary, itemNames, selected, dimmed, highlighted, tabIndex, onSelect, onKeyDown },
  ref
) {
  const { bin, status, total } = summary;
  const hasIcon = isValidIconName(bin.icon);

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            ref={ref}
            type="button"
            data-bin={bin.id}
            tabIndex={tabIndex}
            onClick={onSelect}
            onKeyDown={onKeyDown}
            aria-label={`${binTitle(bin)}, ${statusLabel(status)}${total ? `, ${total} items` : ""}`}
            aria-pressed={selected}
            className={cn(
              "relative flex size-14 items-center justify-center rounded-[15px] text-[13px] font-medium tabular-nums outline-none transition-[opacity,box-shadow,scale] duration-150 ease-out focus-visible:ring-3 focus-visible:ring-ring active:scale-[0.95]",
              tone[status],
              dimmed && "opacity-20 hover:opacity-60",
              highlighted && "ring-2 ring-accent-blue/50 ring-offset-2 ring-offset-background",
              selected && "ring-2 ring-accent-blue ring-offset-2 ring-offset-background"
            )}
          >
            {hasIcon ? (
              <BinIcon iconName={bin.icon} size={20} strokeWidth={1.75} />
            ) : status === "service" ? (
              <WrenchIcon className="size-4.5" strokeWidth={1.75} />
            ) : summary.items.length > 0 ? (
              formatNumber(total)
            ) : null}
            {hasIcon && summary.items.length > 0 && (
              <span className="absolute right-1.5 bottom-1 text-[10px] font-medium leading-none opacity-80">
                {formatNumber(total)}
              </span>
            )}
            {status === "low" && (
              <span aria-hidden className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-bin-low-fg" />
            )}
          </button>
        }
      />
      <TooltipContent side="top" className="flex-col items-start gap-0.5 px-3 py-2">
        <span className="font-mono text-[11px] opacity-70">{bin.locationCode}</span>
        {bin.name && <span className="text-[13px] font-medium">{bin.name}</span>}
        {itemNames.length > 0 ? (
          <span className="max-w-56 truncate text-xs font-normal opacity-80">
            {itemNames.slice(0, 3).join(", ")}
            {itemNames.length > 3 && ` +${itemNames.length - 3} more`}
          </span>
        ) : (
          <span className="text-xs font-normal opacity-80">{status === "service" ? "Out of service" : "Empty"}</span>
        )}
      </TooltipContent>
    </Tooltip>
  );
});
