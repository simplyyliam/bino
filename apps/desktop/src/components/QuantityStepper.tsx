import { useEffect, useState } from "react";
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
  const [draft, setDraft] = useState(String(value));

  useEffect(() => setDraft(String(value)), [value]);

  const commit = () => {
    const parsed = Number.parseInt(draft, 10);
    if (Number.isNaN(parsed)) return setDraft(String(value));
    const next = Math.max(min, parsed);
    setDraft(String(next));
    if (next !== value) onChange(next);
  };

  const step = (delta: number) => {
    const next = Math.max(min, value + delta);
    if (next !== value) onChange(next);
  };

  const buttonClass =
    "flex size-7 items-center justify-center rounded-md text-muted-foreground transition-[background-color,color,scale] duration-150 hover:bg-accent hover:text-foreground active:scale-[0.92] disabled:pointer-events-none disabled:opacity-35";

  return (
    <div
      role="group"
      aria-label={label}
      className={cn(
        "inline-flex h-8 items-center gap-0.5 rounded-lg border border-input bg-card p-0.5 shadow-[0_1px_2px_oklch(0_0_0/0.03)] dark:bg-input/20",
        className
      )}
    >
      <button type="button" className={buttonClass} onClick={() => step(-1)} disabled={value <= min} aria-label={`Decrease ${label}`}>
        <MinusIcon className="size-3.5" />
      </button>
      <input
        value={draft}
        inputMode="numeric"
        aria-label={label}
        onChange={(e) => setDraft(e.target.value.replace(/[^\d]/g, ""))}
        onFocus={(e) => e.currentTarget.select()}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
          if (e.key === "Escape") {
            setDraft(String(value));
            e.currentTarget.blur();
          }
          if (e.key === "ArrowUp") {
            e.preventDefault();
            step(1);
          }
          if (e.key === "ArrowDown") {
            e.preventDefault();
            step(-1);
          }
        }}
        className={cn(
          "h-7 w-10 rounded-md bg-transparent text-center text-[13px] font-semibold tabular-nums outline-none focus:bg-accent",
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
