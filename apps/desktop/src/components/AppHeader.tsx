import { NavLink, Link } from "react-router-dom";
import { SearchIcon } from "lucide-react";
import { Kbd, cn } from "@bino/ui";
import { useSearchStore } from "@bino/store";
import { modKey } from "@/lib/format";
import { LogoMark } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";

const nav = [
  { to: "/", label: "Overview", end: true },
  { to: "/items", label: "Items", end: false },
  { to: "/activity", label: "Activity", end: false },
];

export function AppHeader() {
  const setSearchOpen = useSearchStore((s) => s.setOpen);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="flex h-14 items-center gap-6 px-4 lg:px-6">
        <Link to="/" className="flex items-center gap-2 rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring">
          <LogoMark />
          <span className="text-[15px] font-semibold tracking-tight">Bino</span>
        </Link>

        <nav aria-label="Main" className="flex items-center gap-1">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "rounded-md px-3 py-1.5 text-[13px] font-medium text-muted-foreground transition-colors duration-150 outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring",
                  isActive && "bg-accent text-foreground"
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="flex h-8 w-64 items-center gap-2 rounded-lg border border-input bg-card px-2.5 text-[13px] text-muted-foreground shadow-[0_1px_2px_oklch(0_0_0/0.03)] transition-colors duration-150 outline-none hover:border-foreground/20 focus-visible:ring-3 focus-visible:ring-ring dark:bg-input/20"
          >
            <SearchIcon className="size-4" />
            Search
            <span className="ml-auto flex gap-0.5">
              <Kbd>{modKey}</Kbd>
              <Kbd>K</Kbd>
            </span>
          </button>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
