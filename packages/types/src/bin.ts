export type Bin = {
  id: string;
  storageId: string;
  name: string;
  locationCode: string;
  itemId?: string
  quantity: number
  isOutOfService: boolean
  icon?: string
  // Canonical location fields
  level: number;
  row: number;
  column: number;
  position: number;
};
