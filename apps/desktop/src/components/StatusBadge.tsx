import { cn } from "@bino/ui";
import { statusLabel, type BinStatus } from "@/lib/inventory";

export const statusSwatch: Record<BinStatus, string> = {
  empty: "border border-dashed border-bin-empty bg-transparent",
  stocked: "bg-bin-stocked",
  low: "bg-bin-low",
  out: "bg-bin-out",
  service: "bg-bin-service bg-hatch text-bin-service-fg",
};

const badgeTone: Record<BinStatus, string> = {
  empty: "bg-muted text-muted-foreground",
  stocked: "bg-muted text-foreground",
  low: "bg-bin-low text-bin-low-fg",
  out: "bg-bin-out text-bin-out-fg",
  service: "bg-bin-service text-bin-service-fg",
};

// Small solid markers for lists, where the pale tile fills would wash out.
const markerTone: Record<BinStatus, string> = {
  empty: "border border-dashed border-muted-foreground/50",
  stocked: "bg-foreground/30",
  low: "bg-bin-low-fg",
  out: "bg-bin-out-fg",
  service: "border border-muted-foreground/60 bg-hatch text-muted-foreground",
};

export function StatusSwatch({ status, className }: { status: BinStatus; className?: string }) {
  return <span aria-hidden className={cn("inline-block size-2.5 shrink-0 rounded-full", markerTone[status], className)} />;
}

export function StatusBadge({ status, className }: { status: BinStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium",
        badgeTone[status],
        className
      )}
    >
      {statusLabel(status)}
    </span>
  );
}
