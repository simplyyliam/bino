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
      { levelId: "level-001", canonicalField: "level", startValue: 6, fixedValue: 6 },
      { levelId: "level-002", canonicalField: "position", startValue: 10, fixedValue: 10 },
      { levelId: "level-003", canonicalField: "position", startValue: 1, fixedValue: 1 },
      { levelId: "level-004", canonicalField: "row", startValue: 1 },
      { levelId: "level-005", canonicalField: "column", startValue: 1 }
    ],
    gridConfig: {
      rowCanonicalField: "row",
      columnCanonicalField: "column",
      rowPrefix: "L",
      columnPrefix: "",
      racksPerColumn: 5,
      maxColumns: 18
    }
  },
  {
    id: "location-system-warehouse",
    name: "Aisle / Shelf / Bay",
    usesExistingCodes: true,
    separator: "-",
    paddingWidth: 2,
    levels: [
      { id: "level-aisle", name: "Aisle", order: 0, userManaged: true },
      { id: "level-shelf", name: "Shelf", order: 1, userManaged: true },
      { id: "level-bay", name: "Bay", order: 2, userManaged: true }
    ],
    mappingRules: [
      { levelId: "level-aisle", canonicalField: "level", startValue: 1, fixedValue: 1 },
      { levelId: "level-shelf", canonicalField: "row", startValue: 1 },
      { levelId: "level-bay", canonicalField: "column", startValue: 1 }
    ],
    gridConfig: {
      rowCanonicalField: "row",
      columnCanonicalField: "column",
      rowPrefix: "S",
      columnPrefix: "B",
      racksPerColumn: 4,
      maxColumns: 12
    }
  },
  {
    id: "location-system-default",
    name: "Row / Column (Standard)",
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
    ],
    gridConfig: {
      rowCanonicalField: "row",
      columnCanonicalField: "column",
      rowPrefix: "R",
      columnPrefix: "C",
      racksPerColumn: 5,
      maxColumns: 20
    }
  }
];
