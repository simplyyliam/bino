import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  Button,
  Badge,
} from "@bino/ui";
import { useMovementHistoryStore } from "@bino/store";
import { Clock03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

export const ActivityTimeline = () => {
  // Subscribe to the raw history array (stable reference), derive the slice in the component body
  const history = useMovementHistoryStore((s) => s.history);
  const recentHistory = history.slice(0, 25);
  const [open, setOpen] = useState(false);

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case "icn_created":
        return "✨";
      case "item_added_to_bin":
        return "📦";
      case "item_removed_from_bin":
        return "📤";
      case "quantity_increased":
        return "📈";
      case "quantity_decreased":
        return "📉";
      case "marked_out_of_stock":
        return "⚠️";
      case "marked_out_of_service":
        return "🔧";
      default:
        return "•";
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="sm" className="relative">
            <HugeiconsIcon icon={Clock03Icon} size={18} strokeWidth={1.67} />
            {recentHistory.length > 0 && (
              <Badge
                variant="default"
                className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[9px]"
              >
                {recentHistory.length > 99 ? "99+" : recentHistory.length}
              </Badge>
            )}
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-96">
        <div className="flex items-center justify-between p-3 border-b border-border">
          <h3 className="text-sm font-semibold">Activity Timeline</h3>
          <Badge variant="outline" className="text-[10px]">
            Last 25 events
          </Badge>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {recentHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <HugeiconsIcon
                icon={Clock03Icon}
                size={32}
                strokeWidth={1.5}
                className="text-muted-foreground/50 mb-2"
              />
              <p className="text-sm text-muted-foreground">No activity yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Create ICNs and manage inventory to see activity here
              </p>
            </div>
          ) : (
            <div className="py-2">
              {recentHistory.map((event) => (
                <div
                  key={event.id}
                  className="flex gap-3 px-3 py-2 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-accent flex items-center justify-center text-sm">
                    {getEventIcon(event.eventType)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-foreground leading-relaxed">
                      {event.summary}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {formatTimestamp(event.timestamp)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
