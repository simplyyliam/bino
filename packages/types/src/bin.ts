export type Bin = {
  id: string;
  storageId: string;
  name: string;
  locationCode: string;
  // Canonical location fields
  level: number;
  row: number;
  column: number;
  position: number;
};
