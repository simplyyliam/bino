import { useMemo } from "react";
import { binLink, binTitle, isLow, type BinStatus, type Inventory } from "./inventory";
import { formatNumber } from "./format";

export type Alert = {
  key: string;
  status: BinStatus;
  title: string;
  detail: string;
  code: string;
  buildingId: string;
  buildingName: string;
  href: string;
  rank: number;
};

// Things worth a look today: out of stock first, then low, then broken bins.
export function useAlerts(inv: Inventory) {
  return useMemo(() => {
    const alerts: Alert[] = [];
    for (const summary of inv.summaries.values()) {
      const building = inv.buildingForBin(summary.bin.id);
      if (!building) continue;
      const href = binLink(building.id, summary.bin.id);
      const base = { code: summary.bin.locationCode, buildingId: building.id, buildingName: building.name, href };

      if (summary.status === "service") {
        alerts.push({ ...base, key: `svc-${summary.bin.id}`, status: "service", title: binTitle(summary.bin), detail: "Out of service", rank: 2 });
        continue;
      }
      for (const line of summary.items) {
        const name = inv.itemsById.get(line.itemId)?.name ?? "Unknown item";
        if (line.quantity === 0) {
          alerts.push({ ...base, key: line.id, status: "out", title: name, detail: "Out of stock", rank: 0 });
        } else if (isLow(line)) {
          alerts.push({
            ...base,
            key: line.id,
            status: "low",
            title: name,
            detail: `${formatNumber(line.quantity)} left · alert at ${formatNumber(line.minQuantity!)}`,
            rank: 1,
          });
        }
      }
    }
    return alerts.sort((a, b) => a.rank - b.rank || a.title.localeCompare(b.title));
  }, [inv]);
}
