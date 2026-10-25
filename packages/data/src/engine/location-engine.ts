import type { Bin, Storage, LocationSystem } from "@bino/types";

/**
 * Canonical location representation
 */
export type CanonicalLocation = {
  level: number;
  row: number;
  column: number;
  position: number;
};

/**
 * Determines the next valid canonical location for a new bin in a storage.
 * Pattern: fill N racks/shelves vertically within a column, then advance to next column.
 *
 * @param storage - The storage to add a bin to
 * @param bins - All existing bins in this storage
 * @param system - Optional location system to respect grid configuration
 * @returns The next canonical location
 */
export function getNextBinLocation(
  _storage: Storage,
  bins: Bin[],
  system?: LocationSystem
): CanonicalLocation {
  // If no bins exist, start at origin
  if (bins.length === 0) {
    return { level: 0, row: 0, column: 0, position: 0 };
  }

  // Create a fast lookup of existing occupied locations
  const occupied = new Set(
    bins.map(b => `${b.level ?? 0}-${b.column ?? 0}-${b.row ?? 0}`)
  );

  const racksPerColumn = system?.gridConfig?.racksPerColumn ?? 5;
  const currentLevel = 0;

  // Find the first unoccupied (column, row) slot
  // Iterate columns starting from 0, filling rows 0..(racksPerColumn - 1) vertically
  for (let col = 0; col < 1000; col++) {
    for (let r = 0; r < racksPerColumn; r++) {
      const key = `${currentLevel}-${col}-${r}`;
      if (!occupied.has(key)) {
        return {
          level: currentLevel,
          row: r,
          column: col,
          position: 0
        };
      }
    }
  }

  return { level: 0, row: 0, column: 0, position: 0 };
}

// Formats made before store parts were marked still have one, it's just not
// flagged. Fall back to a fixed part with a store-ish name.
const STORE_NAMES = /^(store|shop|aisle|building|warehouse|site)$/i;

/**
 * Index of the rule that identifies the store/building, or -1 if the format has none.
 */
export function storeRuleIndex(system: LocationSystem): number {
  const flagged = system.mappingRules.findIndex((r) => r.storeNumber);
  if (flagged !== -1) return flagged;
  return system.mappingRules.findIndex((rule) => {
    if (rule.fixedValue === undefined || rule.fixedValue === null) return false;
    const level = system.levels.find((l) => l.id === rule.levelId);
    return !!level && STORE_NAMES.test(level.name.trim());
  });
}

/**
 * The store number a format uses when a building hasn't picked its own.
 */
export function defaultStoreNumber(system: LocationSystem): number | null {
  const i = storeRuleIndex(system);
  if (i === -1) return null;
  const rule = system.mappingRules[i];
  return rule.fixedValue ?? rule.startValue ?? 1;
}

/**
 * Next free store number for a new building on this format, given the
 * storages already using it. null if the format has no store part.
 */
export function nextStoreNumber(system: LocationSystem, storages: { storeNumber?: number | null }[]): number | null {
  if (storeRuleIndex(system) === -1) return null;
  const start = defaultStoreNumber(system) ?? 1;
  if (storages.length === 0) return start;
  const used = storages.map((s) => s.storeNumber ?? start);
  return Math.max(start, ...used) + 1;
}

/**
 * Generates a customer-facing location code from a canonical location
 * using the specified location system's rules.
 *
 * @param location - The canonical location
 * @param system - The location system with mapping rules
 * @param storeNumber - This building's number for the store part, if it has one
 * @returns The generated location code (e.g., "01/02" or "06/10/01/01/01")
 */
export function generateLocationCode(
  location: CanonicalLocation,
  system: LocationSystem,
  storeNumber?: number | null
): string {
  const storeIndex = storeNumber === undefined || storeNumber === null ? -1 : storeRuleIndex(system);

  const parts = system.mappingRules.map((rule, i) => {
    const displayValue =
      i === storeIndex
        ? storeNumber!
        : rule.fixedValue !== undefined && rule.fixedValue !== null
          ? rule.fixedValue
          : location[rule.canonicalField] + rule.startValue;
    return String(displayValue).padStart(system.paddingWidth, "0");
  });

  return parts.join(system.separator);
}

/**
 * Parses a customer-facing location code back into a canonical location.
 * Used when importing existing customer data.
 *
 * @param code - The location code to parse (e.g., "01/02" or "06/10/01/01/01")
 * @param system - The location system with mapping rules
 * @returns The canonical location, or null if parsing fails
 */
export function parseLocationCode(
  code: string,
  system: LocationSystem
): CanonicalLocation | null {
  try {
    // Split by the separator
    const parts = code.split(system.separator);

    // Must have the same number of parts as mapping rules
    if (parts.length !== system.mappingRules.length) {
      return null;
    }

    // Initialize canonical location
    const location: CanonicalLocation = {
      level: 0,
      row: 0,
      column: 0,
      position: 0
    };

    // Process each part according to the mapping rules
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const rule = system.mappingRules[i];

      // Parse the number
      const displayValue = parseInt(part, 10);
      if (isNaN(displayValue)) {
        return null;
      }

      // If it's a fixed value, we don't necessarily update canonical location offsets
      if (rule.fixedValue === undefined) {
        // Reverse the start value offset to get canonical value
        const canonicalValue = displayValue - rule.startValue;
        location[rule.canonicalField] = canonicalValue;
      }
    }

    return location;
  } catch (error) {
    return null;
  }
}


/**
 * Updates storage dimensions if the new location exceeds current maximums.
 *
 * @param storage - The storage to potentially expand
 * @param newLocation - The location that might require expansion
 * @returns Updated storage with expanded dimensions if needed
 */
export function expandStorage(
  storage: Storage,
  newLocation: CanonicalLocation
): Storage {
  return {
    ...storage,
    maxLevel: Math.max(storage.maxLevel, newLocation.level),
    maxRow: Math.max(storage.maxRow, newLocation.row),
    maxColumn: Math.max(storage.maxColumn, newLocation.column)
  };
}
