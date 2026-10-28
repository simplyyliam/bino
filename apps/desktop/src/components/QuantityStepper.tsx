import { useState } from "react";
import { MinusIcon, PlusIcon } from "lucide-react";
import { cn } from "@bino/ui";

type QuantityStepperProps = {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  label: string;
  className?: string;
  tone?: "default" | "low" | "out";
};

// − [ 12 ] +  — buttons save straight away, typing saves on Enter or blur.
export function QuantityStepper({ value, onChange, min = 0, label, className, tone = "default" }: QuantityStepperProps) {
  // Only holds text while the field is being typed in; otherwise we show `value`.
  const [draft, setDraft] = useState<string | null>(null);

  const commit = () => {
    const parsed = Number.parseInt(draft ?? "", 10);
    setDraft(null);
    if (Number.isNaN(parsed)) return;
    const next = Math.max(min, parsed);
    if (next !== value) onChange(next);
  };

  const step = (delta: number) => {
    const next = Math.max(min, value + delta);
    if (next !== value) onChange(next);
  };

  const buttonClass =
    "flex size-7 items-center justify-center rounded-md text-muted-foreground transition-[background-color,color,scale,box-shadow] duration-150 hover:bg-card hover:text-foreground hover:shadow-pill active:scale-[0.92] disabled:pointer-events-none disabled:opacity-35";

  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        "inline-flex h-8 items-center gap-0.5 rounded-lg bg-field p-0.5",
        className
      )}
    >
      <button type="button" className={buttonClass} onClick={() => step(-1)} disabled={value <= min} aria-label={`Decrease ${label}`}>
        <MinusIcon className="size-3.5" />
      </button>
      <input
        value={draft ?? String(value)}
        inputMode="numeric"
        aria-label={label}
        onChange={(e) => setDraft(e.target.value.replace(/[^\d]/g, ""))}
        onFocus={(e) => {
          setDraft(String(value));
          e.currentTarget.select();
        }}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
          if (e.key === "Escape") {
            // Throw the typing away *before* blur runs commit.
            e.stopPropagation();
            setDraft(null);
            const input = e.currentTarget;
            requestAnimationFrame(() => input.blur());
          }
          if (e.key === "ArrowUp" || e.key === "ArrowDown") {
            e.preventDefault();
            const next = Math.max(min, value + (e.key === "ArrowUp" ? 1 : -1));
            setDraft(String(next));
            if (next !== value) onChange(next);
          }
        }}
        className={cn(
          "h-7 w-10 rounded-md bg-transparent text-center text-[13px] font-medium tabular-nums outline-none focus:bg-card focus:shadow-pill",
          tone === "low" && "text-bin-low-fg",
          tone === "out" && "text-bin-out-fg"
        )}
      />
      <button type="button" className={buttonClass} onClick={() => step(1)} aria-label={`Increase ${label}`}>
        <PlusIcon className="size-3.5" />
      </button>
    </div>
  );
}
