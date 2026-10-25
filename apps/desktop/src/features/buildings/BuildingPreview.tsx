import type { LocationSystem } from "@bino/types";
import { cn } from "@bino/ui";
import { BuildingGlyph } from "@/components/BuildingGlyph";
import { LogoMark } from "@/components/Logo";
import { plural } from "@/lib/format";

// Enough columns to read as a grid without the panel scrolling sideways.
const MAX_COLUMNS = 9;

type BuildingPreviewProps = {
  name: string;
  number: string;
  system?: LocationSystem;
  firstCode: string;
  binCount: number;
};

// The New Building dialog's side panel: the building taking shape as you fill the form in.
export function BuildingPreview({ name, number, system, firstCode, binCount }: BuildingPreviewProps) {
  const title = name.trim();
  const rows = system?.gridConfig?.racksPerColumn ?? 5;
  const shown = Math.min(binCount, rows * MAX_COLUMNS);

  return (
    <div className="relative flex h-full flex-col gap-6 bg-canvas p-6 pt-14">
      <div className="flex items-center gap-2.5">
        <BuildingGlyph id="preview" name={title || "?"} className="size-8 rounded-[10px] bg-foreground/8 text-[14px] text-foreground/70" />
        <div className="flex min-w-0 flex-col">
          <span className={cn("truncate text-[14px] font-medium", !title && "text-faint-foreground")}>{title || "Your building"}</span>
          <span className="text-xs text-muted-foreground tabular-nums">
            {number.trim() ? `Building ${number.trim()} · ` : ""}
            {plural(binCount, "bin")}
          </span>
        </div>
      </div>

      {firstCode && <BinLabel code={firstCode} system={system} building={title} />}

      {/* New bins are empty, so they're drawn the way the real grid draws empty bins. */}
      <div className="flex flex-col gap-2">
        <div
          aria-hidden
          className="grid w-max grid-flow-col gap-1"
          style={{ gridTemplateRows: `repeat(${rows}, 1.375rem)`, gridAutoColumns: "1.375rem" }}
        >
          {Array.from({ length: shown }, (_, i) => (
            <span
              key={i}
              className={cn(
                "rounded-[5px] border-[1.5px] border-dashed border-bin-empty animate-in fade-in-0 zoom-in-50 duration-200",
                i === 0 && "border-solid border-accent-blue bg-accent-blue/10"
              )}
            />
          ))}
        </div>
        <span className="text-xs text-muted-foreground tabular-nums">
          {binCount === 0
            ? "No bins yet. Add them whenever you're ready."
            : binCount > shown
              ? `And ${binCount - shown} more`
              : "Empty and ready to fill"}
        </span>
      </div>

    </div>
  );
}

// The first bin's code as it'd look on the printed label, with each part named.
function BinLabel({ code, system, building }: { code: string; system?: LocationSystem; building: string }) {
  const parts = system?.separator ? code.split(system.separator) : [code];
  const names = system?.mappingRules.map((rule) => system.levels.find((l) => l.id === rule.levelId)?.name ?? "");
  const labelled = names && names.length === parts.length;

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-card p-4 shadow-card">
      <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <LogoMark className="size-3.5" />
          First bin label
        </span>
        <span className="truncate">{building}</span>
      </div>
      <div className="flex items-start font-mono tabular-nums" aria-label={`First bin code ${code}`}>
        {parts.map((part, i) => (
          <span key={i} className="flex items-start">
            {i > 0 && <span className="px-px text-[17px] leading-6 text-faint-foreground">{system?.separator}</span>}
            <span className="flex flex-col items-center">
              <span className="text-[17px] leading-6 tracking-tight">{part}</span>
              {labelled && <span className="max-w-14 truncate font-sans text-[9.5px] text-muted-foreground">{names[i]}</span>}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
