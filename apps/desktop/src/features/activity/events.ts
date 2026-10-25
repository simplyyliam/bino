import {
  ArrowRightLeftIcon,
  CircleCheckIcon,
  CircleSlashIcon,
  MinusIcon,
  PackageMinusIcon,
  PackagePlusIcon,
  PlusIcon,
  TagIcon,
  WrenchIcon,
  type LucideIcon,
} from "lucide-react";
import type { MovementHistoryEventType } from "@bino/types";

export type EventKind = "stock" | "items" | "moves" | "bins" | "icns";

export const EVENT_KINDS: { value: EventKind; label: string }[] = [
  { value: "stock", label: "Quantity changes" },
  { value: "items", label: "Items added or removed" },
  { value: "moves", label: "Moves" },
  { value: "bins", label: "Bin status" },
  { value: "icns", label: "New ICNs" },
];

export const EVENT_META: Record<MovementHistoryEventType, { label: string; icon: LucideIcon; kind: EventKind }> = {
  quantity_increased: { label: "Restocked", icon: PlusIcon, kind: "stock" },
  quantity_decreased: { label: "Taken out", icon: MinusIcon, kind: "stock" },
  marked_out_of_stock: { label: "Set to 0", icon: CircleSlashIcon, kind: "stock" },
  item_added_to_bin: { label: "Added", icon: PackagePlusIcon, kind: "items" },
  item_removed_from_bin: { label: "Removed", icon: PackageMinusIcon, kind: "items" },
  item_moved_between_bins: { label: "Moved", icon: ArrowRightLeftIcon, kind: "moves" },
  marked_out_of_service: { label: "Out of service", icon: WrenchIcon, kind: "bins" },
  marked_serviceable: { label: "Back in service", icon: CircleCheckIcon, kind: "bins" },
  icn_created: { label: "ICN created", icon: TagIcon, kind: "icns" },
};

export const eventMeta = (type: string) =>
  EVENT_META[type as MovementHistoryEventType] ?? { label: type, icon: TagIcon, kind: "items" as EventKind };
