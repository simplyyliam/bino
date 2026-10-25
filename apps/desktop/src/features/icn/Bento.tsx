import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@bino/ui";
import { TONES, revealItem, type Tone } from "./styles";

// A superellipse (|x|^4 + |y|^4 = 1) on a 0–24 box. Smoother corners than a
// rounded square, the way app icons are drawn.
const SQUIRCLE = (() => {
  const points: string[] = [];
  for (let i = 0; i < 64; i++) {
    const t = (i / 64) * Math.PI * 2;
    const cos = Math.cos(t);
    const sin = Math.sin(t);
    const x = 12 + 12 * Math.sign(cos) * Math.abs(cos) ** 0.5;
    const y = 12 + 12 * Math.sign(sin) * Math.abs(sin) ** 0.5;
    points.push(`${x.toFixed(2)} ${y.toFixed(2)}`);
  }
  return `M${points.join(" L")} Z`;
})();

export function SquircleIcon({ icon: Icon, tone = "grey", className }: { icon: LucideIcon; tone?: Tone; className?: string }) {
  return (
    <span aria-hidden className={cn("relative inline-flex size-6 shrink-0 items-center justify-center", TONES[tone], className)}>
      <svg viewBox="0 0 24 24" className="absolute inset-0 size-full">
        <path d={SQUIRCLE} fill="var(--squircle)" />
      </svg>
      <Icon className="relative size-3.5" strokeWidth={2} />
    </span>
  );
}

type BentoProps = {
  icon: LucideIcon;
  title: string;
  tone?: Tone;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
};

export function Bento({ icon, title, tone, action, className, children }: BentoProps) {
  return (
    <motion.section
      variants={revealItem}
      aria-label={title}
      className={cn("flex min-w-0 flex-col gap-4 rounded-2xl bg-card p-4 shadow-card", className)}
    >
      <header className="flex items-center gap-2">
        <SquircleIcon icon={icon} tone={tone} />
        <h2 className="text-xs font-medium text-muted-foreground">{title}</h2>
        {action && <div className="ml-auto">{action}</div>}
      </header>
      {children}
    </motion.section>
  );
}
