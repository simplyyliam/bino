import { useNavigate, Outlet } from "react-router-dom";
import { CloudOffIcon } from "lucide-react";
import { Button } from "@bino/ui";
import { useAppStore, useUiStore } from "@bino/store";
import { useGoToShortcuts, useHotkey } from "@/lib/hotkeys";
import { EmptyState } from "./EmptyState";
import { SearchCommand } from "./SearchCommand";
import { ShortcutsDialog } from "./ShortcutsDialog";
import { Sidebar } from "./Sidebar";

const bar = "rounded-md bg-surface";

// Roughly the shape of the app, so the first load doesn't feel like a blank page.
function LoadingSkeleton() {
  const isSlow = useAppStore((s) => s.isSlow);
  return (
    <div className="flex h-full flex-col" aria-busy="true" aria-label="Loading">
      <div className="flex h-12 items-center border-b border-border px-4">
        <div className={`${bar} h-3.5 w-28 animate-pulse`} />
      </div>
      <div className="flex flex-col gap-6 p-8">
        <div className={`${bar} h-5 w-48 animate-pulse`} />
        <div className="grid grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className={`${bar} h-40 animate-pulse rounded-2xl`} style={{ animationDelay: `${i * 120}ms` }} />
          ))}
        </div>
        {isSlow && (
          <p className="text-[13px] text-muted-foreground animate-in fade-in-0">
            Waking the server up. The first load can take up to a minute.
          </p>
        )}
      </div>
    </div>
  );
}

function Offline() {
  const error = useAppStore((s) => s.error);
  const load = useAppStore((s) => s.load);
  return (
    <div className="flex h-full items-center justify-center">
      <EmptyState
        icon={CloudOffIcon}
        title="Can't reach Bino"
        description={<>Check your internet connection and try again.{error && <span className="mt-2 block text-xs">{error}</span>}</>}
        action={<Button onClick={() => void load()}>Try Again</Button>}
      />
    </div>
  );
}

function GlobalShortcuts() {
  const navigate = useNavigate();
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const setShortcutsOpen = useUiStore((s) => s.setShortcutsOpen);

  useGoToShortcuts({ o: "/", i: "/items", a: "/activity" }, navigate);
  useHotkey("\\", toggleSidebar, { meta: true });
  useHotkey("?", () => setShortcutsOpen(true));
  return null;
}

export function AppLayout() {
  const status = useAppStore((s) => s.status);
  const sidebarOpen = useUiStore((s) => s.sidebarOpen);
  const ready = status === "ready";

  return (
    <div className="flex h-dvh bg-canvas">
      {sidebarOpen && ready && <Sidebar />}
      <main className={`flex min-w-0 flex-1 p-2 ${sidebarOpen && ready ? "pl-0" : ""}`}>
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-[14px] bg-background shadow-card">
          {status === "error" ? <Offline /> : ready ? <Outlet /> : <LoadingSkeleton />}
        </div>
      </main>
      {ready && (
        <>
          <SearchCommand />
          <ShortcutsDialog />
          <GlobalShortcuts />
        </>
      )}
    </div>
  );
}
