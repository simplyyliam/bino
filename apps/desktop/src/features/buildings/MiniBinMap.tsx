import type { Bin } from "@bino/types";
import { cn } from "@bino/ui";
import type { BinSummary } from "@/lib/inventory";
import { statusSwatch } from "@/lib/bin-styles";

type MiniBinMapProps = {
  bins: Bin[];
  summaries: Map<string, BinSummary>;
  rows: number;
  className?: string;
};

// A thumbnail of the building's bin grid, one tiny square per bin.
export function MiniBinMap({ bins, summaries, rows, className }: MiniBinMapProps) {
  const columns = Math.max(1, ...bins.map((b) => b.column + 1));
  const cells = new Map(bins.map((b) => [`${b.row}-${b.column}`, b]));

  return (
    <div
      aria-hidden
      className={cn("grid gap-[3px]", className)}
      style={{ gridTemplateColumns: `repeat(${columns}, 10px)`, gridTemplateRows: `repeat(${rows}, 10px)` }}
    >
      {Array.from({ length: rows * columns }, (_, i) => {
        const row = Math.floor(i / columns);
        const col = i % columns;
        const bin = cells.get(`${row}-${col}`);
        const status = bin ? summaries.get(bin.id)?.status : undefined;
        return (
          <span
            key={i}
            className={cn("rounded-[3px]", status ? statusSwatch[status] : "bg-transparent")}
          />
        );
      })}
    </div>
  );
}
