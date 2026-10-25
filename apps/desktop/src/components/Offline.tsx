import { CloudOffIcon } from "lucide-react";
import { Button } from "@bino/ui";
import { useAppStore } from "@bino/store";
import { EmptyState } from "./EmptyState";

export function Offline() {
  const error = useAppStore((s) => s.error);
  const load = useAppStore((s) => s.load);
  return (
    <div className="flex h-full flex-1 items-center justify-center">
      <EmptyState
        icon={CloudOffIcon}
        title="Can't reach Bino"
        description={<>Check your internet connection and try again.{error && <span className="mt-2 block text-xs">{error}</span>}</>}
        action={<Button onClick={() => void load()}>Try Again</Button>}
      />
    </div>
  );
}
