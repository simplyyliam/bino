import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion, useReducedMotion, type Variants } from "motion/react";
import {
  ArrowRightIcon,
  BarcodeIcon,
  CopyIcon,
  HistoryIcon,
  LayersIcon,
  MapPinIcon,
  MapPinOffIcon,
  PackageIcon,
  SmartphoneIcon,
  TagIcon,
  WrenchIcon,
} from "lucide-react";
import { useLocationSystemStore, useMovementHistoryStore } from "@bino/store";
import { Button, Tooltip, TooltipContent, TooltipTrigger } from "@bino/ui";
import { TopBar } from "@/components/TopBar";
import { LocationTag } from "@/components/LocationTag";
import { StatusBadge } from "@/components/StatusBadge";
import { BuildingGlyph } from "@/components/BuildingGlyph";
import NotFound from "@/components/NotFound";
import { Bento } from "@/features/icn/Bento";
import { revealItem, type Tone } from "@/features/icn/styles";
import { Barcode } from "@/features/icn/Barcode";
import { IcnHistory } from "@/features/icn/IcnHistory";
import { binLink, isLow, useInventory, type BinStatus } from "@/lib/inventory";
import { copyText } from "@/lib/clipboard";
import { formatDate, formatNumber, formatRelative } from "@/lib/format";

const METADATA_LABELS: Record<string, string> = {
  manufacturer: "Manufacturer",
  partNumber: "Part number",
  serialNumber: "Serial number",
};

const STOCK_TONE: Record<BinStatus, Tone> = { stocked: "green", low: "amber", out: "red", empty: "grey", service: "grey" };

const pad = (n: number) => String(n).padStart(2, "0");

// The intro plays once per tag per session; coming back shouldn't make you wait.
const SEEN_KEY = "bino-icn-intro";
const hasSeen = (value: string) => {
  try {
    return (JSON.parse(sessionStorage.getItem(SEEN_KEY) ?? "[]") as string[]).includes(value);
  } catch {
    return true;
  }
};
const markSeen = (value: string) => {
  try {
    const seen = JSON.parse(sessionStorage.getItem(SEEN_KEY) ?? "[]") as string[];
    sessionStorage.setItem(SEEN_KEY, JSON.stringify([...new Set([...seen, value])]));
  } catch {
    // Without storage it just plays every time.
  }
};

const HOLD_MS = 650;
const glide = { type: "spring", duration: 0.8, bounce: 0 } as const;

export default function IcnPage() {
  const { icnValue = "" } = useParams();
  const value = decodeURIComponent(icnValue).trim().toUpperCase();
  const reduceMotion = useReducedMotion();
  const [phase, setPhase] = useState<"intro" | "settled">(() => (reduceMotion || hasSeen(value) ? "settled" : "intro"));

  useEffect(() => {
    if (phase !== "intro") return;
    markSeen(value);
    const t = setTimeout(() => setPhase("settled"), HOLD_MS);
    return () => clearTimeout(t);
  }, [phase, value]);

  const inv = useInventory();
  const history = useMovementHistoryStore((s) => s.history);
  const systems = useLocationSystemStore((s) => s.locationSystems);

  const icn = inv.icns.find((i) => i.value.toUpperCase() === value);
  const item = icn ? inv.itemsById.get(icn.itemId) : undefined;
  const line = icn ? inv.binItems.find((bi) => bi.icnId === icn.id) : undefined;
  const summary = line ? inv.summaries.get(line.binId) : undefined;
  const building = line ? inv.buildingForBin(line.binId) : undefined;
  const storage = summary ? inv.storagesById.get(summary.bin.storageId) : undefined;
  const system = systems.find((s) => s.id === storage?.locationSystemId);

  const events = icn ? history.filter((e) => e.icnId === icn.id).slice(0, 6) : [];

  // Same item in other bins, so you know where else to look.
  const elsewhere = item
    ? inv.binItems
        .filter((bi) => bi.itemId === item.id && bi.id !== line?.id)
        .map((bi) => ({ line: bi, bin: inv.summaries.get(bi.binId)?.bin, building: inv.buildingForBin(bi.binId) }))
        .filter((x) => x.bin && x.building)
    : [];

  if (!icn || !item) {
    return <NotFound title={`No ICN called “${value}”`} description="Check the number on the tag and try again." />;
  }

  const details = Object.entries(icn.metadata ?? {})
    .filter(([, v]) => v !== undefined && v !== null && String(v).trim() !== "")
    .map(([k, v]) => [METADATA_LABELS[k] ?? k, String(v)] as const);

  const stockTone = summary ? STOCK_TONE[summary.status] : "grey";
  const low = line ? isLow(line) : false;

  // Ripples the boxes in one after another once the number starts moving up.
  const container: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: reduceMotion ? 0 : 0.06, delayChildren: reduceMotion ? 0 : 0.12 } },
  };
  const itemVariants = reduceMotion ? { hidden: { opacity: 0 }, show: { opacity: 1 } } : revealItem;

  const hero = (
    <motion.h1
      layoutId="icn-hero"
      transition={glide}
      className={
        phase === "intro"
          ? "font-mono text-[64px] leading-none font-medium tracking-tight"
          : "font-mono text-[28px] leading-none font-medium tracking-tight"
      }
      initial={phase === "intro" ? { opacity: 0, filter: "blur(10px)", scale: 0.96 } : false}
      animate={{ opacity: 1, filter: "blur(0px)", scale: 1 }}
    >
      {icn.value}
    </motion.h1>
  );

  return (
    <>
      <TopBar
        crumbs={[{ label: "Items", to: "/items", icon: PackageIcon }, { label: icn.value, icon: TagIcon }]}
        actions={
          <Button variant="ghost" size="sm" nativeButton={false} render={<Link to={`/tag/${encodeURIComponent(icn.value)}`} />}>
            <SmartphoneIcon /> Tag View
          </Button>
        }
      />

      <div className="relative min-h-0 flex-1 overflow-y-auto scrollbar-thin">
        {phase === "intro" && (
          <div className="absolute inset-0 flex items-center justify-center">
            {hero}
          </div>
        )}

        {phase === "settled" && (
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-6 py-10 lg:px-10"
          >
            <header className="flex flex-wrap items-end justify-between gap-4">
              <div className="flex min-w-0 flex-col gap-2">
                <motion.span variants={itemVariants} className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <TagIcon className="size-3.5" /> Item control number
                </motion.span>
                {hero}
                <motion.p variants={itemVariants} className="text-[13px] text-muted-foreground">
                  {item.name}
                  {item.category && <> · {item.category}</>}
                </motion.p>
              </div>
              <motion.div variants={itemVariants} className="flex items-center gap-1.5">
                <Button variant="outline" size="sm" onClick={() => copyText(icn.value)}>
                  <CopyIcon /> Copy
                </Button>
                {summary && building && (
                  <Button size="sm" nativeButton={false} render={<Link to={binLink(building.id, summary.bin.id)} />}>
                    Open Bin <ArrowRightIcon />
                  </Button>
                )}
              </motion.div>
            </header>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-6">
              {/* Where it is: the answer people come here for, so it gets the widest box. */}
              <Bento icon={MapPinIcon} title="Location" tone="blue" className="md:col-span-4">
                {summary && building ? (
                  <div className="flex flex-wrap items-end justify-between gap-4">
                    <div className="flex flex-col gap-1.5">
                      <span className="text-xs text-muted-foreground">Find it in</span>
                      <span className="font-mono text-xl font-medium tracking-tight tabular-nums">{summary.bin.locationCode}</span>
                      <span className="text-[13px] text-muted-foreground">
                        {system?.gridConfig?.rowPrefix ?? "R"}
                        {pad(summary.bin.row + 1)} shelf · column {system?.gridConfig?.columnPrefix ?? ""}
                        {pad(summary.bin.column + 1)}
                        {summary.bin.name && <> · {summary.bin.name}</>}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[13px]">
                      <BuildingGlyph id={building.id} name={building.name} />
                      <span>{building.name}</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2.5 text-[13px] text-muted-foreground">
                    <MapPinOffIcon className="size-4" /> Not in a bin right now.
                  </div>
                )}
              </Bento>

              <Bento icon={LayersIcon} title="In stock" tone={stockTone} className="md:col-span-2">
                {line && summary ? (
                  <div className="flex flex-col gap-2">
                    <span className="text-xl font-medium tabular-nums">{formatNumber(line.quantity)}</span>
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={summary.status} />
                      {line.minQuantity != null && (
                        <span className={low || line.quantity === 0 ? "text-xs text-bin-low-fg" : "text-xs text-muted-foreground"}>
                          Alert at {formatNumber(line.minQuantity)}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">Updated {formatRelative(line.lastModified).toLowerCase()}</span>
                  </div>
                ) : (
                  <span className="text-[13px] text-muted-foreground">—</span>
                )}
              </Bento>

              <Bento icon={PackageIcon} title="Item" tone="violet" className="md:col-span-3">
                <div className="flex flex-col gap-1">
                  <span className="text-[13px] font-medium">{item.name}</span>
                  {item.description ? (
                    <p className="text-[13px] text-muted-foreground">{item.description}</p>
                  ) : (
                    <p className="text-[13px] text-faint-foreground">No description</p>
                  )}
                </div>
                {elsewhere.length > 0 && (
                  <div className="flex flex-col gap-1.5 border-t border-border pt-3">
                    <span className="text-xs text-muted-foreground">Also in</span>
                    <div className="flex flex-wrap gap-1.5">
                      {elsewhere.slice(0, 4).map(({ line: l, bin, building: b }) => (
                        <Tooltip key={l.id}>
                          <TooltipTrigger
                            render={
                              <Link to={binLink(b!.id, bin!.id)} className="rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring">
                                <LocationTag code={bin!.locationCode} className="h-6 transition-colors hover:bg-accent" />
                              </Link>
                            }
                          />
                          <TooltipContent>
                            {b!.name} · {formatNumber(l.quantity)} {l.quantity === 1 ? "piece" : "pieces"}
                          </TooltipContent>
                        </Tooltip>
                      ))}
                      {elsewhere.length > 4 && <span className="self-center text-xs text-muted-foreground">+{elsewhere.length - 4}</span>}
                    </div>
                  </div>
                )}
              </Bento>

              <Bento icon={WrenchIcon} title="Part details" className="md:col-span-3">
                <dl className="flex flex-col gap-2 text-[13px]">
                  {details.map(([label, v]) => (
                    <div key={label} className="flex justify-between gap-4">
                      <dt className="text-muted-foreground">{label}</dt>
                      <dd className="truncate text-right font-medium">{v}</dd>
                    </div>
                  ))}
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Tagged</dt>
                    <dd className="text-right">{formatDate(icn.createdAt)}</dd>
                  </div>
                </dl>
              </Bento>

              <Bento icon={HistoryIcon} title="History" className="md:col-span-4">
                <IcnHistory events={events} inv={inv} />
              </Bento>

              <Bento
                icon={BarcodeIcon}
                title="Tag"
                className="md:col-span-2"
                action={
                  <Button variant="ghost" size="icon-xs" className="text-muted-foreground" onClick={() => copyText(icn.value)} aria-label="Copy ICN">
                    <CopyIcon />
                  </Button>
                }
              >
                <div className="flex flex-col items-center gap-2 rounded-xl bg-white px-3 py-3 text-black dark:bg-[oklch(0.97_0_0)]">
                  <Barcode value={icn.value} className="text-black" />
                  <span className="font-mono text-xs tracking-[0.2em]">{icn.value}</span>
                </div>
                <p className="text-xs text-muted-foreground">Code 39. Print it on the part's label and any scanner can read it.</p>
              </Bento>
            </div>

          </motion.div>
        )}
      </div>
    </>
  );
}
