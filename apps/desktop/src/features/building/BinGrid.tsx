import { useMemo, useRef } from "react";
import type { BinSummary } from "@/lib/inventory";
import { BinTile } from "./BinTile";

type BinGridProps = {
  summaries: BinSummary[];
  rows: number;
  columns: number;
  rowLabel: (index: number) => string;
  columnLabel: (index: number) => string;
  selectedId: string | null;
  onSelect: (binId: string) => void;
  isDimmed: (summary: BinSummary) => boolean;
  isHighlighted: (summary: BinSummary) => boolean;
  itemNames: (summary: BinSummary) => string[];
};

const ARROWS: Record<string, [number, number]> = {
  ArrowUp: [-1, 0],
  ArrowDown: [1, 0],
  ArrowLeft: [0, -1],
  ArrowRight: [0, 1],
};

const headerCell = "sticky z-10 flex items-center justify-center bg-background text-xs font-medium text-muted-foreground tabular-nums select-none";

export function BinGrid({
  summaries,
  rows,
  columns,
  rowLabel,
  columnLabel,
  selectedId,
  onSelect,
  isDimmed,
  isHighlighted,
  itemNames,
}: BinGridProps) {
  const tileRefs = useRef(new Map<string, HTMLButtonElement>());

  const cells = useMemo(() => {
    const map = new Map<string, BinSummary>();
    for (const s of summaries) map.set(`${s.bin.row}-${s.bin.column}`, s);
    return map;
  }, [summaries]);

  // Roving tab stop: Tab lands on the selected bin (or the first one), arrows do the rest.
  const tabStopId = selectedId && summaries.some((s) => s.bin.id === selectedId) ? selectedId : summaries[0]?.bin.id;

  const move = (from: BinSummary, e: React.KeyboardEvent) => {
    const delta = ARROWS[e.key];
    if (!delta) return;
    e.preventDefault();
    let row = from.bin.row + delta[0];
    let col = from.bin.column + delta[1];
    // Skip over gaps until we hit a bin or fall off the grid.
    while (row >= 0 && row < rows && col >= 0 && col < columns) {
      const next = cells.get(`${row}-${col}`);
      if (next) {
        tileRefs.current.get(next.bin.id)?.focus();
        if (selectedId) onSelect(next.bin.id);
        return;
      }
      row += delta[0];
      col += delta[1];
    }
  };

  return (
    <div className="flex min-w-full p-6 pt-4">
      <div
        role="grid"
        aria-label="Bins"
        aria-rowcount={rows}
        aria-colcount={columns}
        className="mx-auto grid"
        style={{ gridTemplateColumns: `3rem repeat(${columns}, 4rem)`, gridTemplateRows: `2rem repeat(${rows}, 4rem)` }}
      >
        <div className={`${headerCell} top-0 left-0 z-20`} />
        {Array.from({ length: columns }, (_, c) => (
          <div key={`c${c}`} className={`${headerCell} top-0`}>
            {columnLabel(c)}
          </div>
        ))}

        {Array.from({ length: rows }, (_, r) => (
          <div key={`r${r}`} role="row" className="contents">
            <div className={`${headerCell} left-0 justify-end pr-3`}>{rowLabel(r)}</div>
            {Array.from({ length: columns }, (_, c) => {
              const summary = cells.get(`${r}-${c}`);
              return (
                <div key={c} role="gridcell" className="flex items-center justify-center">
                  {summary && (
                    <BinTile
                      ref={(el) => {
                        if (el) tileRefs.current.set(summary.bin.id, el);
                        else tileRefs.current.delete(summary.bin.id);
                      }}
                      summary={summary}
                      itemNames={itemNames(summary)}
                      selected={summary.bin.id === selectedId}
                      dimmed={isDimmed(summary)}
                      highlighted={isHighlighted(summary)}
                      tabIndex={summary.bin.id === tabStopId ? 0 : -1}
                      onSelect={() => onSelect(summary.bin.id)}
                      onKeyDown={(e) => move(summary, e)}
                    />
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
