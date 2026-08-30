import type { LocationSystem } from "@bino/types";

export const LocationSystems: LocationSystem[] = [
  {
    id: "location-system-001",
    name: "Group / Store / Row / Rack / Bin",
    usesExistingCodes: true,
    separator: "/",
    paddingWidth: 2,
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
    ],
    mappingRules: [
      { levelId: "level-001", canonicalField: "level", startValue: 6 },
      { levelId: "level-002", canonicalField: "position", startValue: 10 },
      { levelId: "level-003", canonicalField: "row", startValue: 1 },
      { levelId: "level-004", canonicalField: "column", startValue: 1 },
      { levelId: "level-005", canonicalField: "position", startValue: 1 }
    ]
  },
  {
    id: "location-system-default",
    name: "Row / Column",
    usesExistingCodes: false,
    separator: "/",
    paddingWidth: 2,
    levels: [
      {
        id: "level-row",
        name: "Row",
        order: 0,
        userManaged: false
      },
      {
        id: "level-column",
        name: "Column",
        order: 1,
        userManaged: false
      }
    ],
    mappingRules: [
      { levelId: "level-row", canonicalField: "row", startValue: 1 },
      { levelId: "level-column", canonicalField: "column", startValue: 1 }
    ]
  }
];
