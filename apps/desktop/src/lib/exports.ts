import type { Building } from "@bino/types";
import { downloadCsv, fileSafe } from "./csv";
import { statusLabel, type Inventory } from "./inventory";

// One row per item per bin, plus a row for each empty bin, so a printout
// works as a stock-take sheet.
export function exportBuildingCsv(inv: Inventory, building: Building) {
  const storage = inv.storageByBuilding.get(building.id);
  const bins = storage ? [...(inv.binsByStorage.get(storage.id) ?? [])] : [];
  bins.sort((a, b) => a.column - b.column || a.row - b.row);

  const rows: unknown[][] = [];
  for (const bin of bins) {
    const summary = inv.summaries.get(bin.id);
    const status = summary ? statusLabel(summary.status) : "";
    if (!summary || summary.items.length === 0) {
      rows.push([bin.locationCode, bin.name, "", "", "", "", status]);
      continue;
    }
    for (const line of summary.items) {
      rows.push([
        bin.locationCode,
        bin.name,
        inv.itemsById.get(line.itemId)?.name ?? "",
        line.icnId ? inv.icnsById.get(line.icnId)?.value ?? "" : "",
        line.quantity,
        line.minQuantity ?? "",
        status,
      ]);
    }
  }

  downloadCsv(
    `${fileSafe(building.name)}-inventory.csv`,
    ["Bin code", "Bin label", "Item", "ICN", "Quantity", "Low-stock alert", "Bin status"],
    rows
  );
}

export function exportItemsCsv(inv: Inventory) {
  const rows = inv.items.map((item) => {
    const lines = inv.binItems.filter((bi) => bi.itemId === item.id);
    const places = lines.map((bi) => {
      const bin = inv.summaries.get(bi.binId)?.bin;
      const building = inv.buildingForBin(bi.binId);
      return `${building?.name ?? "?"} ${bin?.locationCode ?? ""} (${bi.quantity})`;
    });
    return [
      item.name,
      item.category ?? "",
      item.description ?? "",
      lines.reduce((sum, bi) => sum + bi.quantity, 0),
      places.join("; "),
    ];
  });
  downloadCsv("bino-items.csv", ["Item", "Category", "Description", "Total quantity", "Locations"], rows);
}
