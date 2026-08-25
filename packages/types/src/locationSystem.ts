import type { LocationLevel } from "./locationLevel"

export type LocationSystem = {
  id: string
  name: string
  levels: LocationLevel[]
  usesExistingCodes: boolean
}
