import type { LocationSystem } from "@bino/types";

export const locationSystem: LocationSystem[] = [{
  id: "location-system-001",
  name: "Group / Store / Row / Rack / Bin",
  usesExistingCodes: true,
  levels: [
    {
      id: "level-001",
      name: "Group",
      order: 0,
      userManaged: true 
    },
    {
      id: "level-002",
      name: "Store",
      order: 1,
      userManaged: true 
    },
    {
      id: "level-003",
      name: "Row",
      order: 2,
      userManaged: true 
    },
    {
      id: "level-004",
      name: "Rack",
      order: 3,
      userManaged: true 
    },
    {
      id: "level-005",
      name: "Bin",
      order: 4,
      userManaged: true 
    },
  ]
}]
