export type Storage = {
  id: string
  buildingId: string
  name: string
  locationSystemId: string
  // Dynamic dimensions tracking
  maxLevel: number
  maxRow: number
  maxColumn: number
}