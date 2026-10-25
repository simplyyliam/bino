import { Fragment, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ChevronRightIcon, PanelLeftIcon } from "lucide-react";
import { Button, Kbd, Tooltip, TooltipContent, TooltipTrigger, cn } from "@bino/ui";
import { useUiStore } from "@bino/store";
import { modKey } from "@/lib/format";

export type Crumb = { label: ReactNode; to?: string };

type TopBarProps = {
  crumbs: Crumb[];
  actions?: ReactNode;
  className?: string;
};

export function SidebarToggle() {
  const toggle = useUiStore((s) => s.toggleSidebar);
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button variant="ghost" size="icon-xs" onClick={toggle} aria-label="Toggle sidebar">
            <PanelLeftIcon />
          </Button>
        }
      />
      <TooltipContent className="gap-2">
        Toggle sidebar <Kbd>{modKey} \</Kbd>
      </TooltipContent>
    </Tooltip>
  );
}

// The slim bar across the top of every page: where you are, and what you can do here.
export function TopBar({ crumbs, actions, className }: TopBarProps) {
  const sidebarOpen = useUiStore((s) => s.sidebarOpen);

  return (
    <header className={cn("flex h-12 shrink-0 items-center gap-2 border-b border-border px-3", className)}>
      {!sidebarOpen && <SidebarToggle />}
      <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1 text-[13px]">
        {crumbs.map((crumb, i) => {
          const last = i === crumbs.length - 1;
          return (
            <Fragment key={i}>
              {i > 0 && <ChevronRightIcon aria-hidden className="size-3.5 shrink-0 text-faint-foreground" />}
              {crumb.to && !last ? (
                <Link
                  to={crumb.to}
                  className="truncate rounded-md px-1.5 py-0.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className={cn("truncate px-1.5", last ? "font-medium text-foreground" : "text-muted-foreground")} aria-current={last ? "page" : undefined}>
                  {crumb.label}
                </span>
              )}
            </Fragment>
          );
        })}
      </nav>
      {actions && <div className="ml-auto flex shrink-0 items-center gap-1.5">{actions}</div>}
    </header>
  );
}

// A row under the top bar for filters and view controls.
export function Toolbar({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("flex min-h-12 shrink-0 flex-wrap items-center gap-2 border-b border-border px-4 py-2", className)}>
      {children}
    </div>
  );
}
