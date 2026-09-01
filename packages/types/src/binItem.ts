export type BinItem = {
  id: string;
  binId: string;
  itemId: string;
  icnId?: string; // Optional reference to specific ICN
  quantity: number;
  addedAt: string; // ISO timestamp
  lastModified: string; // ISO timestamp
  notes?: string;
};
