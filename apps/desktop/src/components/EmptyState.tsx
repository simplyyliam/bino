import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@bino/ui";

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
};

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-3 px-6 py-14 text-center", className)}>
      <div className="flex size-11 items-center justify-center rounded-2xl bg-surface text-muted-foreground">
        <Icon className="size-5" strokeWidth={1.75} />
      </div>
      <div className="flex max-w-sm flex-col gap-1">
        <h3 className="text-sm font-medium">{title}</h3>
        {description && <p className="text-[13px] text-muted-foreground">{description}</p>}
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
