import * as Icons from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface BinIconProps {
  iconName?: string;
  size?: number;
  strokeWidth?: number;
  className?: string;
}

// Static icon mapping - only load icons that are actually used
const iconMap: Record<string, LucideIcon> = {
  Package: Icons.Package,
  Box: Icons.Box,
  Package2: Icons.Package2,
  PackageCheck: Icons.PackageCheck,
  Boxes: Icons.Boxes,
  Archive: Icons.Archive,
  FolderArchive: Icons.FolderArchive,
  Wrench: Icons.Wrench,
  HardDrive: Icons.HardDrive,
  Database: Icons.Database,
  Server: Icons.Server,
  Cpu: Icons.Cpu,
  CircuitBoard: Icons.CircuitBoard,
  Zap: Icons.Zap,
  Warehouse: Icons.Warehouse,
  // Add more as needed
};

export const BinIcon = ({ iconName, size = 24, strokeWidth = 1.75, className = "" }: BinIconProps) => {
  if (!iconName || !iconMap[iconName]) {
    return <Icons.Package size={size} strokeWidth={strokeWidth} className={className} />;
  }

  const Icon = iconMap[iconName];
  return <Icon size={size} strokeWidth={strokeWidth} className={className} />;
};
