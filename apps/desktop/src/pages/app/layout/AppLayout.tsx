import { useNavigate, Outlet } from "react-router-dom";
import { useAppStore, useUiStore } from "@bino/store";
import { DotmSquare12 } from "@bino/ui";
import { useGoToShortcuts, useHotkey } from "@/lib/hotkeys";
import { Offline } from "@/components/Offline";
import { SearchCommand } from "@/components/SearchCommand";
import { ShortcutsDialog } from "@/components/ShortcutsDialog";
import { Sidebar } from "@/components/Sidebar";

// First load. Render's free tier can take a while to wake, so say so when it does.
function Loading() {
  const isSlow = useAppStore((s) => s.isSlow);
  return (
    <div className="flex h-full flex-1 flex-col items-center justify-center gap-5 animate-in fade-in-0 duration-300" aria-busy="true">
      <DotmSquare12 size={40} dotSize={5} dotShape="square" ariaLabel="Loading your bins" className="text-foreground" />
      <div className="flex flex-col items-center gap-1 text-center">
        <p className="text-[13px] text-muted-foreground">Loading your bins</p>
        {isSlow && (
          <p className="max-w-xs text-xs text-faint-foreground animate-in fade-in-0 duration-300">
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
        {status === "error" ? <Offline /> : ready ? <Outlet /> : <Loading />}
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
