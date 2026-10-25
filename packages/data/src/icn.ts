/**
 * ICN values end up as Code 39 barcodes on part tags, so they're limited to
 * what Code 39 can print and what sits safely in a URL: letters, digits,
 * "-" and ".". Stored uppercase so lookups and scans always match.
 */
export const ICN_MAX_LENGTH = 32;

const ICN_PATTERN = /^[A-Z0-9][A-Z0-9.-]*$/;

/**
 * The next automatic ICN after the highest ICN-000123 in use. Custom ICNs in
 * other shapes don't affect the count.
 */
export function nextIcnValue(existing: string[]): string {
  const max = existing.reduce((m, value) => {
    const match = value.match(/^ICN-(\d+)$/);
    return match ? Math.max(m, parseInt(match[1], 10)) : m;
  }, 0);
  return `ICN-${String(max + 1).padStart(6, "0")}`;
}

/** Uppercases and trims a typed ICN. */
export function normalizeIcn(value: string): string {
  return value.trim().toUpperCase();
}

/**
 * Checks a normalized ICN. Returns a plain-language problem, or null if it's fine.
 */
export function icnProblem(value: string): string | null {
  if (!value) return "Type an ICN, or leave it blank to get the next number.";
  if (value.length > ICN_MAX_LENGTH) return `Keep it to ${ICN_MAX_LENGTH} characters or fewer.`;
  if (!ICN_PATTERN.test(value)) return "Use only letters, numbers, dashes and dots, so the tag's barcode can scan.";
  return null;
}
