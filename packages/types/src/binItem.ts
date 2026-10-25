export type BinItem = {
  id: string;
  binId: string;
  itemId: string;
  icnId?: string; // Optional reference to specific ICN
  quantity: number;
  minQuantity?: number | null; // Low-stock threshold; null/undefined = no alert
  addedAt: string; // ISO timestamp
  lastModified: string; // ISO timestamp
  notes?: string;
};
