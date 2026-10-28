import { cn } from "@bino/ui";

// The bin's printed code, styled like the label stuck on the front of a bin.
export function LocationTag({ code, className }: { code: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded-md bg-surface px-2 font-mono text-[11.5px] tracking-tight text-foreground/80 tabular-nums",
        className
      )}
    >
      {code}
    </span>
  );
}
