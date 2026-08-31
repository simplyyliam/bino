// lib/icons.ts
import { iconNames, type IconName } from "lucide-react/dynamic";

const iconNameSet = new Set<string>(iconNames);

export function isValidIconName(value: string | undefined | null): value is IconName {
  return !!value && iconNameSet.has(value);
}