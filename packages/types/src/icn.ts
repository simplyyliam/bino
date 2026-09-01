export type ICN = {
  id: string;
  value: string; // The actual ICN code (e.g., "ICN-000001")
  itemId: string; // The item this ICN identifies
  createdAt: string; // ISO timestamp
  metadata?: {
    manufacturer?: string;
    partNumber?: string;
    serialNumber?: string;
    [key: string]: any;
  };
};
