import { cn } from "@bino/ui";

// The bin's printed code, styled like the label stuck on the front of a bin.
export function LocationTag({ code, className }: { code: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded-md border border-border bg-surface px-1.5 font-mono text-xs tracking-tight text-foreground/90 tabular-nums",
        className
      )}
    >
      {code}
    </span>
  );
}
