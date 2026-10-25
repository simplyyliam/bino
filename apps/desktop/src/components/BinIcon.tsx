import { PackageIcon } from "lucide-react";
import { DynamicIcon } from "lucide-react/dynamic";
import { isValidIconName } from "@/lib/icons";

type BinIconProps = {
  iconName?: string | null;
  size?: number;
  strokeWidth?: number;
  className?: string;
};

export function BinIcon({ iconName, size = 24, strokeWidth = 1.75, className }: BinIconProps) {
  if (!isValidIconName(iconName)) {
    return <PackageIcon size={size} strokeWidth={strokeWidth} className={className} />;
  }
  return <DynamicIcon name={iconName} size={size} strokeWidth={strokeWidth} className={className} />;
}
