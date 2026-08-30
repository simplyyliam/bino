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
 * Default pattern: fill columns first, then rows, then levels.
 *
 * @param storage - The storage to add a bin to
 * @param bins - All existing bins in this storage
 * @returns The next canonical location
 */
export function getNextBinLocation(
  storage: Storage,
  bins: Bin[]
): CanonicalLocation {
  // If no bins exist, start at origin
  if (bins.length === 0) {
    return { level: 0, row: 0, column: 0, position: 0 };
  }

  // Find the highest location values currently in use
  const maxUsedLevel = Math.max(...bins.map(b => b.level));
  const maxUsedRow = Math.max(...bins.map(b => b.row));
  const maxUsedColumn = Math.max(...bins.map(b => b.column));

  // Default expansion pattern: column -> row -> level
  // Try next column in current row
  if (maxUsedColumn < storage.maxColumn) {
    return {
      level: maxUsedLevel,
      row: maxUsedRow,
      column: maxUsedColumn + 1,
      position: 0
    };
  }

  // Try next row in current level
  if (maxUsedRow < storage.maxRow) {
    return {
      level: maxUsedLevel,
      row: maxUsedRow + 1,
      column: 0,
      position: 0
    };
  }

  // Expand to next level
  return {
    level: maxUsedLevel + 1,
    row: 0,
    column: 0,
    position: 0
  };
}

/**
 * Generates a customer-facing location code from a canonical location
 * using the specified location system's rules.
 *
 * @param location - The canonical location
 * @param system - The location system with mapping rules
 * @returns The generated location code (e.g., "01/02" or "06/10/01/01/01")
 */
export function generateLocationCode(
  location: CanonicalLocation,
  system: LocationSystem
): string {
  const parts: string[] = [];

  // Process each level in order according to mapping rules
  for (const rule of system.mappingRules) {
    // Get the value from the canonical location
    const canonicalValue = location[rule.canonicalField];

    // Apply the start value offset
    const displayValue = canonicalValue + rule.startValue;

    // Pad according to system configuration
    const paddedValue = String(displayValue).padStart(system.paddingWidth, '0');

    parts.push(paddedValue);
  }

  // Join with the system's separator
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

      // Reverse the start value offset to get canonical value
      const canonicalValue = displayValue - rule.startValue;

      // Set the appropriate canonical field
      location[rule.canonicalField] = canonicalValue;
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

/**
 * Helper function to organize bins into a 2D grid structure
 * for rendering purposes.
 *
 * @param bins - All bins to organize
 * @param rows - Number of rows in the grid
 * @param columns - Number of columns in the grid
 * @returns 2D array of bins organized by [row][column]
 */
export function organizeBinsIntoGrid(
  bins: Bin[],
  rows: number,
  columns: number
): (Bin | null)[][] {
  // Initialize empty grid
  const grid: (Bin | null)[][] = Array.from({ length: rows }, () =>
    Array.from({ length: columns }, () => null)
  );

  // Place each bin in its canonical position
  for (const bin of bins) {
    if (bin.row < rows && bin.column < columns) {
      grid[bin.row][bin.column] = bin;
    }
  }

  return grid;
}
