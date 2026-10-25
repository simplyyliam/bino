import { cn } from "@bino/ui";
import { BIN_STATUSES, type BinStatus } from "@/lib/inventory";
import { StatusSwatch } from "@/components/StatusBadge";

type StatusFilterProps = {
  counts: Record<BinStatus, number>;
  total: number;
  value: BinStatus | null;
  onChange: (value: BinStatus | null) => void;
};

// Doubles as the legend: every status is always listed, with its count.
export function StatusFilter({ counts, total, value, onChange }: StatusFilterProps) {
  const chip = (active: boolean) =>
    cn(
      "flex h-8 items-center gap-2 rounded-full px-3 text-[13px] font-medium whitespace-nowrap transition-[color,background-color,box-shadow] duration-150 outline-none focus-visible:ring-3 focus-visible:ring-ring",
      active ? "bg-card text-foreground shadow-pill" : "text-muted-foreground hover:text-foreground"
    );

  return (
    <div role="radiogroup" aria-label="Show bins" className="flex flex-wrap items-center gap-0.5 rounded-full bg-foreground/[0.04] p-1">
      <button type="button" role="radio" aria-checked={value === null} className={chip(value === null)} onClick={() => onChange(null)}>
        All <span className="text-muted-foreground tabular-nums">{total}</span>
      </button>
      {BIN_STATUSES.map((s) => (
        <button
          key={s.value}
          type="button"
          role="radio"
          title={s.hint}
          aria-checked={value === s.value}
          disabled={counts[s.value] === 0 && value !== s.value}
          className={cn(chip(value === s.value), "disabled:opacity-40 disabled:hover:text-muted-foreground")}
          onClick={() => onChange(value === s.value ? null : s.value)}
        >
          <StatusSwatch status={s.value} />
          {s.label}
          <span className="text-muted-foreground tabular-nums">{counts[s.value]}</span>
        </button>
      ))}
    </div>
  );
}
