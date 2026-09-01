export type MovementHistoryEventType =
  | "icn_created"
  | "item_added_to_bin"
  | "item_removed_from_bin"
  | "item_moved_between_bins"
  | "quantity_increased"
  | "quantity_decreased"
  | "marked_out_of_stock"
  | "marked_out_of_service"
  | "marked_serviceable";

export type MovementHistoryEvent = {
  id: string;
  timestamp: string; // ISO timestamp
  eventType: MovementHistoryEventType;

  // What was affected
  binId?: string;
  itemId?: string;
  icnId?: string;
  binItemId?: string;

  // Change details
  fromBinId?: string; // For moves
  toBinId?: string; // For moves
  quantityBefore?: number;
  quantityAfter?: number;

  // Context
  reason?: string; // User-provided reason for the change
  user?: string; // Who made the change (for future multi-user support)

  // Human-readable summary
  summary: string; // e.g., "Arduino Uno added to bin 06/10/01/01/01 with quantity 3"
};
