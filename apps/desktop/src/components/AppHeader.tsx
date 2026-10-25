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
    <header className="sticky top-0 z-40 bg-canvas/85 backdrop-blur-md">
      <div className="flex h-14 items-center gap-6 px-4 lg:px-6">
        <Link to="/" className="flex items-center gap-2 rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring">
          <LogoMark />
          <span className="text-[15px] font-medium tracking-tight">Bino</span>
        </Link>

        <nav aria-label="Main" className="flex items-center gap-1">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "rounded-full px-3.5 py-1.5 text-[13px] font-medium text-muted-foreground transition-[color,background-color,box-shadow] duration-150 outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring",
                  isActive && "bg-card text-foreground shadow-pill"
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
            className="flex h-8 w-64 items-center gap-2 rounded-full bg-card pr-1.5 pl-3 text-[13px] text-faint-foreground shadow-pill transition-colors duration-150 outline-none hover:text-muted-foreground focus-visible:ring-3 focus-visible:ring-ring"
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
