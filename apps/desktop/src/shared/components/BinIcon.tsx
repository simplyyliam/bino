import { Package } from "lucide-react";
import { DynamicIcon } from "lucide-react/dynamic";
import { isValidIconName } from "@/lib/icons";

interface BinIconProps {
  iconName?: string;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export const BinIcon = ({ iconName, size = 24, strokeWidth = 1.75, className = "" }: BinIconProps) => {
  if (!isValidIconName(iconName)) {
    return <Package size={size} strokeWidth={strokeWidth} className={className} />;
  }

  return <DynamicIcon name={iconName} size={size} strokeWidth={strokeWidth} className={className} />;
};
