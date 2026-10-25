import { Link, useParams } from "react-router-dom";
import { ArrowRightIcon, MapPinOffIcon } from "lucide-react";
import { Button } from "@bino/ui";
import { LogoMark } from "@/components/Logo";
import { LocationTag } from "@/components/LocationTag";
import { StatusBadge } from "@/components/StatusBadge";
import { binLink, binTitle, useInventory } from "@/lib/inventory";
import { formatNumber } from "@/lib/format";

// What you land on after scanning a part's tag: what it is and where it lives,
// big enough to read on a phone in a dim shed.
export default function TagPage() {
  const { icnValue = "" } = useParams();
  const inv = useInventory();
  const value = decodeURIComponent(icnValue).trim().toUpperCase();

  const icn = inv.icns.find((i) => i.value.toUpperCase() === value);
  const item = icn ? inv.itemsById.get(icn.itemId) : undefined;
  const line = icn ? inv.binItems.find((bi) => bi.icnId === icn.id) : undefined;
  const summary = line ? inv.summaries.get(line.binId) : undefined;
  const building = line ? inv.buildingForBin(line.binId) : undefined;

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-5 py-10">
      <div className="w-full max-w-sm rounded-3xl bg-card p-6 shadow-raised">
        {!icn || !item ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <p className="font-mono text-sm text-muted-foreground">{value || "No tag"}</p>
            <h1 className="text-lg font-medium">We couldn't find this tag</h1>
            <p className="text-[13px] text-muted-foreground">Check the number and try again.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-1">
              <span className="font-mono text-xs text-muted-foreground">{icn.value}</span>
              <h1 className="text-2xl font-medium tracking-tight">{item.name}</h1>
              {item.description && <p className="text-[13px] text-muted-foreground">{item.description}</p>}
            </div>

            {summary && building && line ? (
              <div className="flex flex-col gap-4 rounded-2xl bg-surface p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-muted-foreground">{building.name}</span>
                    <LocationTag code={summary.bin.locationCode} className="h-7 bg-card text-[13px]" />
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-3xl font-medium tabular-nums">{formatNumber(line.quantity)}</span>
                    <span className="text-xs text-muted-foreground">in {binTitle(summary.bin)}</span>
                  </div>
                </div>
                <StatusBadge status={summary.status} className="self-start" />
              </div>
            ) : (
              <div className="flex items-center gap-3 rounded-2xl bg-surface p-4 text-[13px] text-muted-foreground">
                <MapPinOffIcon className="size-4" /> Not in any bin right now.
              </div>
            )}

            {summary && building && (
              <Button size="lg" nativeButton={false} render={<Link to={binLink(building.id, summary.bin.id)} />}>
                Open in Bino <ArrowRightIcon />
              </Button>
            )}
          </div>
        )}
      </div>
      <Link to="/" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground">
        <LogoMark className="size-4" /> Bino
      </Link>
    </div>
  );
}
