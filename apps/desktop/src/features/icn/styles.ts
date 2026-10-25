import type { Variants } from "motion/react";

// Squircle tints: icon colour plus the fill, light and dark.
export const TONES = {
  blue: "text-[oklch(0.52_0.15_256)] [--squircle:oklch(0.94_0.04_256)] dark:text-[oklch(0.78_0.11_256)] dark:[--squircle:oklch(0.32_0.06_256)]",
  green: "text-[oklch(0.5_0.12_155)] [--squircle:oklch(0.94_0.05_155)] dark:text-[oklch(0.78_0.12_155)] dark:[--squircle:oklch(0.31_0.05_155)]",
  amber: "text-[oklch(0.55_0.12_70)] [--squircle:oklch(0.95_0.06_85)] dark:text-[oklch(0.84_0.12_85)] dark:[--squircle:oklch(0.33_0.06_80)]",
  red: "text-[oklch(0.55_0.17_25)] [--squircle:oklch(0.94_0.04_25)] dark:text-[oklch(0.8_0.11_25)] dark:[--squircle:oklch(0.32_0.06_25)]",
  violet: "text-[oklch(0.5_0.14_300)] [--squircle:oklch(0.94_0.04_300)] dark:text-[oklch(0.8_0.1_300)] dark:[--squircle:oklch(0.32_0.06_300)]",
  grey: "text-muted-foreground [--squircle:var(--surface)]",
} as const;

export type Tone = keyof typeof TONES;

// Fade + blur in, used for the staggered entrance of each box.
export const revealItem: Variants = {
  hidden: { opacity: 0, y: 10, filter: "blur(6px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.45, ease: [0.2, 0.9, 0.3, 1] } },
};
