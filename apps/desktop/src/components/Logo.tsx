import { cn } from "@bino/ui";

// A little 2×2 bin grid with one bin picked out — that's the whole app.
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={cn("size-6", className)}>
      <rect x="2" y="2" width="9" height="9" rx="2.5" className="fill-foreground/85" />
      <rect x="13" y="2" width="9" height="9" rx="2.5" className="fill-primary" />
      <rect x="2" y="13" width="9" height="9" rx="2.5" className="fill-foreground/85" />
      <rect x="13" y="13" width="9" height="9" rx="2.5" className="fill-foreground/25" />
    </svg>
  );
}
