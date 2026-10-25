export type Storage = {
  id: string
  buildingId: string
  name: string
  locationSystemId: string
  // This building's number in the store part of its code (e.g. the 11 in 06/11/01/01/01).
  // null = use the format's own fixed value, which is how buildings made before this existed work.
  storeNumber?: number | null
  // Dynamic dimensions tracking
  maxLevel: number
  maxRow: number
  maxColumn: number
}