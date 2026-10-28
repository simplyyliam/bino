import { Outlet } from "react-router-dom";
import { useAppStore } from "@bino/store";
import { DotmSquare12 } from "@bino/ui";
import { Offline } from "@/components/Offline";

// For pages that stand on their own: no sidebar, no app chrome. Think a
// scanned label, a printout or a one-off info screen.
export default function StandaloneLayout() {
  const status = useAppStore((s) => s.status);

  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      {status === "error" ? (
        <Offline />
      ) : status === "ready" ? (
        <Outlet />
      ) : (
        <div className="flex flex-1 items-center justify-center">
          <DotmSquare12 size={32} dotSize={4} dotShape="square" ariaLabel="Loading" className="text-foreground" />
        </div>
      )}
    </div>
  );
}
