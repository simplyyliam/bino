import type { LocationLevel } from "./locationLevel"

export type LocationMappingRule = {
  levelId: string
  canonicalField: 'level' | 'row' | 'column' | 'position'
  startValue: number
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
}