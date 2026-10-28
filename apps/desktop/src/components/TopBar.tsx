import { Fragment, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { PanelLeftIcon, type LucideIcon } from "lucide-react";
import { Button, Kbd, Tooltip, TooltipContent, TooltipTrigger, cn } from "@bino/ui";
import { useUiStore } from "@bino/store";
import { modKey } from "@/lib/format";

export type Crumb = { label: ReactNode; to?: string; icon?: LucideIcon };

type TopBarProps = {
  crumbs: Crumb[];
  /** Sits right after the current page's pill, usually a "···" menu. */
  menu?: ReactNode;
  actions?: ReactNode;
  className?: string;
};

// The grey pill the current page sits in. Also used by crumbs that render their own trigger.
export const crumbPill =
  "flex h-7 min-w-0 items-center gap-1.5 rounded-lg bg-accent px-2 text-[13px] text-foreground outline-none transition-colors duration-100 focus-visible:ring-3 focus-visible:ring-ring";

export function SidebarToggle() {
  const toggle = useUiStore((s) => s.toggleSidebar);
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button variant="ghost" size="icon-xs" className="text-muted-foreground hover:text-foreground" onClick={toggle} aria-label="Toggle sidebar">
            <PanelLeftIcon className="size-4" />
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
export function TopBar({ crumbs, menu, actions, className }: TopBarProps) {
  const sidebarOpen = useUiStore((s) => s.sidebarOpen);

  return (
    <header className={cn("flex h-12 shrink-0 items-center gap-2 border-b border-border px-4", className)}>
      {!sidebarOpen && <SidebarToggle />}
      <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1">
        {crumbs.map((crumb, i) => {
          const last = i === crumbs.length - 1;
          const Icon = crumb.icon;
          return (
            <Fragment key={i}>
              {i > 0 && (
                <span aria-hidden className="px-0.5 text-[13px] text-faint-foreground">
                  /
                </span>
              )}
              {!last ? (
                crumb.to ? (
                  <Link
                    to={crumb.to}
                    className="flex h-7 items-center gap-1.5 truncate rounded-lg px-1.5 text-[13px] text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring"
                  >
                    {Icon && <Icon className="size-4 shrink-0" strokeWidth={1.75} />}
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="truncate px-1.5 text-[13px] text-muted-foreground">{crumb.label}</span>
                )
              ) : typeof crumb.label === "string" ? (
                <span className={crumbPill} aria-current="page">
                  {Icon && <Icon className="size-4 shrink-0" strokeWidth={1.75} />}
                  <span className="truncate">{crumb.label}</span>
                </span>
              ) : (
                // A custom crumb (e.g. a switcher) brings its own pill.
                <span aria-current="page" className="flex min-w-0">
                  {crumb.label}
                </span>
              )}
            </Fragment>
          );
        })}
        {menu}
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
