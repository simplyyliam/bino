// lib/icon-categories.ts
import type { IconName } from "lucide-react/dynamic";

export interface IconCategory {
  label: string;
  icons: IconName[];
}

export const ICON_CATEGORIES: IconCategory[] = [
  {
    label: "Storage & Containers",
    icons: ["box", "archive", "package", "package-open", "package-check", "container", "inbox", "layers", "shopping-basket", "warehouse", "vault", "briefcase", "luggage"],
  },
  {
    label: "Tools & Hardware",
    icons: ["wrench", "hammer", "drill", "pickaxe", "axe", "toolbox", "cog", "bolt", "nut", "hexagon", "magnet", "hard-hat", "construction", "paint-roller"],
  },
  {
    label: "Electronics & Tech",
    icons: ["battery", "battery-full", "plug", "zap", "cpu", "hard-drive", "usb", "router", "wifi", "monitor", "smartphone", "laptop", "cable", "circuit-board", "microchip", "server", "lightbulb", "flashlight"],
  },
  {
    label: "Automotive",
    icons: ["car", "car-front", "car-battery", "fuel", "gauge", "disc", "truck"],
  },
  {
    label: "Kitchen & Food",
    icons: ["utensils", "coffee", "apple", "cookie", "refrigerator", "soup", "wine", "cup-soda", "egg", "fish", "carrot", "pizza", "sandwich", "milk", "beer"],
  },
  {
    label: "Office & Documents",
    icons: ["file", "folder", "paperclip", "printer", "book", "pen", "pencil", "clipboard", "sticky-note", "stamp", "ruler", "eraser"],
  },
  {
    label: "Clothing & Textiles",
    icons: ["shirt", "scissors", "shopping-bag", "footprints", "glasses"],
  },
  {
    label: "Outdoor & Garden",
    icons: ["leaf", "flower", "tree-pine", "shovel", "sprout", "flame", "sun", "tent", "mountain"],
  },
  {
    label: "Cleaning & Chemicals",
    icons: ["spray-can", "droplet", "flask-conical", "beaker", "test-tube", "trash-2", "brush"],
  },
  {
    label: "Medical & Safety",
    icons: ["cross", "shield", "syringe", "pill", "stethoscope", "bandage", "heart-pulse", "thermometer"],
  },
  {
    label: "Sports & Recreation",
    icons: ["dumbbell", "trophy", "target", "bike", "tent"],
  },
  {
    label: "Art & Craft",
    icons: ["palette", "paintbrush", "pipette", "pencil-ruler"],
  },
  {
    label: "Valuables & Documents",
    icons: ["key", "key-round", "lock", "lock-open", "tag", "tags", "barcode", "qr-code", "ticket", "gift", "gem", "coins", "banknote", "wallet", "anchor", "link"],
  },
  {
    label: "General",
    icons: ["circle", "square", "triangle", "star", "hash", "package-search"],
  },
];

// Flat list for search-across-everything and default preview.
export const ALL_CATEGORY_ICONS: IconName[] = ICON_CATEGORIES.flatMap((c) => c.icons);