import { useNavigate, Outlet } from "react-router-dom";
import { useAppStore, useUiStore } from "@bino/store";
import { useGoToShortcuts, useHotkey } from "@/lib/hotkeys";
import { Offline } from "@/components/Offline";
import { SearchCommand } from "@/components/SearchCommand";
import { ShortcutsDialog } from "@/components/ShortcutsDialog";
import { Sidebar } from "@/components/Sidebar";

const bar = "rounded-md bg-surface";

// Roughly the shape of the app, so the first load doesn't feel like a blank page.
function LoadingSkeleton() {
  const isSlow = useAppStore((s) => s.isSlow);
  return (
    <div className="flex h-full flex-col" aria-busy="true" aria-label="Loading">
      <div className="flex h-12 items-center border-b border-border px-4">
        <div className={`${bar} h-7 w-32 animate-pulse rounded-lg`} />
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

function GlobalShortcuts() {
  const navigate = useNavigate();
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const setShortcutsOpen = useUiStore((s) => s.setShortcutsOpen);

  useGoToShortcuts({ o: "/", i: "/items", a: "/activity" }, navigate);
  useHotkey("\\", toggleSidebar, { meta: true });
  useHotkey("?", () => setShortcutsOpen(true));
  return null;
}

export default function AppLayout() {
  const status = useAppStore((s) => s.status);
  const sidebarOpen = useUiStore((s) => s.sidebarOpen);
  const ready = status === "ready";

  return (
    <div className="flex h-dvh bg-background">
      {sidebarOpen && ready && <Sidebar />}
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden bg-background">
        {status === "error" ? <Offline /> : ready ? <Outlet /> : <LoadingSkeleton />}
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
