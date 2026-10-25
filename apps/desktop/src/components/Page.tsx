import type { ReactNode } from "react";
import { cn } from "@bino/ui";

// The scrolling area under a page's top bar.
export function Page({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto scrollbar-thin">
      <div className={cn("mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-8 lg:px-10", className)}>{children}</div>
    </div>
  );
}

export function Section({ title, meta, children }: { title: string; meta?: ReactNode; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between px-0.5">
        <h2 className="text-[13px] font-medium text-muted-foreground">{title}</h2>
        {meta && <span className="text-xs text-muted-foreground tabular-nums">{meta}</span>}
      </div>
      {children}
    </section>
  );
}
