import { cn } from "@bino/ui";

// Soft tints so each building is easy to spot in lists. Picked from the id so
// a building keeps its colour across sessions.
const TINTS = [
  "bg-[oklch(0.93_0.05_256)] text-[oklch(0.45_0.14_256)]",
  "bg-[oklch(0.93_0.05_300)] text-[oklch(0.45_0.13_300)]",
  "bg-[oklch(0.93_0.06_155)] text-[oklch(0.43_0.11_155)]",
  "bg-[oklch(0.94_0.07_80)] text-[oklch(0.48_0.11_70)]",
  "bg-[oklch(0.93_0.05_20)] text-[oklch(0.48_0.14_25)]",
  "bg-[oklch(0.93_0.05_200)] text-[oklch(0.45_0.1_210)]",
];

const tintFor = (id: string) => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return TINTS[Math.abs(hash) % TINTS.length];
};

export function BuildingGlyph({ id, name, className }: { id: string; name: string; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex size-5 shrink-0 items-center justify-center rounded-md text-[11px] font-semibold dark:brightness-90 dark:saturate-75",
        tintFor(id),
        className
      )}
    >
      {name.trim().charAt(0).toUpperCase() || "?"}
    </span>
  );
}
