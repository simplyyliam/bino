import { Link } from "react-router-dom";
import { MapPinOffIcon } from "lucide-react";
import { Button } from "@bino/ui";
import { EmptyState } from "@/components/EmptyState";

export default function NotFound({ title = "Page not found", description = "That link doesn't go anywhere in Bino." }: { title?: string; description?: string }) {
  return (
    <div className="flex flex-1 items-center justify-center">
      <EmptyState
        icon={MapPinOffIcon}
        title={title}
        description={description}
        action={<Button nativeButton={false} render={<Link to="/" />}>Back to Overview</Button>}
      />
    </div>
  );
}
