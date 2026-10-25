import { Outlet } from "react-router-dom";
import { CloudOffIcon, LoaderCircleIcon } from "lucide-react";
import { Button } from "@bino/ui";
import { useAppStore } from "@bino/store";
import { AppHeader } from "./AppHeader";
import { SearchCommand } from "./SearchCommand";
import { EmptyState } from "./EmptyState";

function Loading() {
  const isSlow = useAppStore((s) => s.isSlow);
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
      <LoaderCircleIcon className="size-5 animate-spin text-muted-foreground" />
      <p className="text-[13px] text-muted-foreground">
        {isSlow ? "Waking the server up. This can take up to a minute the first time." : "Loading your inventory…"}
      </p>
    </div>
  );
}

function Offline() {
  const error = useAppStore((s) => s.error);
  const load = useAppStore((s) => s.load);
  return (
    <div className="flex flex-1 items-center justify-center">
      <EmptyState
        icon={CloudOffIcon}
        title="Can't reach Bino"
        description={<>Check your internet connection and try again.{error && <span className="mt-2 block text-xs">{error}</span>}</>}
        action={<Button onClick={() => void load()}>Try Again</Button>}
      />
    </div>
  );
}

export function AppLayout() {
  const status = useAppStore((s) => s.status);

  return (
    <div className="flex h-dvh flex-col">
      <AppHeader />
      <main className="flex min-h-0 flex-1 flex-col overflow-y-auto scrollbar-thin">
        {status === "error" ? <Offline /> : status === "ready" ? <Outlet /> : <Loading />}
      </main>
      <SearchCommand />
    </div>
  );
}
