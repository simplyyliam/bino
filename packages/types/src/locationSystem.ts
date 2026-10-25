import type { LocationLevel } from "./locationLevel"

export type LocationMappingRule = {
  levelId: string
  canonicalField: 'level' | 'row' | 'column' | 'position'
  startValue: number
  fixedValue?: number
  // Marks the part that tells stores apart; each building fills in its own number.
  storeNumber?: boolean
}

export type LocationGridConfig = {
  rowCanonicalField?: 'level' | 'row' | 'column' | 'position'
  columnCanonicalField?: 'level' | 'row' | 'column' | 'position'
  rowPrefix?: string
  columnPrefix?: string
  racksPerColumn?: number
  maxColumns?: number
}

export type LocationSystem = {
  id: string
  name: string
  levels: LocationLevel[]
  usesExistingCodes: boolean
  // Code generation configuration
  separator: string
  paddingWidth: number
  mappingRules: LocationMappingRule[]
  gridConfig?: LocationGridConfig
}