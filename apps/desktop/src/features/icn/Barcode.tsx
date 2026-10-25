import { cn } from "@bino/ui";

// Code 39: each character is 9 elements (bar, space, bar, ...), 1 = wide.
// Covers what ICNs use (A–Z, 0–9, "-") plus the start/stop "*".
const CODE39: Record<string, string> = {
  "0": "000110100", "1": "100100001", "2": "001100001", "3": "101100000", "4": "000110001",
  "5": "100110000", "6": "001110000", "7": "000100101", "8": "100100100", "9": "001100100",
  A: "100001001", B: "001001001", C: "101001000", D: "000011001", E: "100011000",
  F: "001011000", G: "000001101", H: "100001100", I: "001001100", J: "000011100",
  K: "100000011", L: "001000011", M: "101000010", N: "000010011", O: "100010010",
  P: "001010010", Q: "000000111", R: "100000110", S: "001000110", T: "000010110",
  U: "110000001", V: "011000001", W: "111000000", X: "010010001", Y: "110010000",
  Z: "011010000", "-": "010000101", ".": "110000100", " ": "011000100", "*": "010010100",
};

const NARROW = 1;
const WIDE = 2.5;

// Bars as [x, width] pairs in narrow-bar units, plus the total width.
function code39Bars(text: string) {
  const chars = `*${text.toUpperCase().replace(/[^0-9A-Z. -]/g, "")}*`;
  const bars: [number, number][] = [];
  let x = 0;
  for (const ch of chars) {
    const pattern = CODE39[ch];
    for (let i = 0; i < 9; i++) {
      const w = pattern[i] === "1" ? WIDE : NARROW;
      if (i % 2 === 0) bars.push([x, w]);
      x += w;
    }
    x += NARROW; // gap between characters
  }
  return { bars, width: x - NARROW };
}

export function Barcode({ value, className }: { value: string; className?: string }) {
  const { bars, width } = code39Bars(value);
  return (
    <svg
      role="img"
      aria-label={`Barcode for ${value}`}
      viewBox={`-10 0 ${width + 20} 40`}
      preserveAspectRatio="none"
      className={cn("h-11 w-full text-foreground", className)}
    >
      {bars.map(([x, w], i) => (
        <rect key={i} x={x} y={0} width={w} height={40} className="fill-current" />
      ))}
    </svg>
  );
}
