import React, { useMemo, useState, useRef, useEffect } from "react"
import { useBinStore, useStorageStore, useLocationSystemStore, useSearchStore, useItemStore } from "@bino/store"
import { getBinState, organizeBinsIntoGrid } from "@bino/data"
import { useParams } from "react-router-dom"
import { BinDetailSheet } from "@/features/building/components/BinDetailSheet"
import { BinIcon } from "@/shared/components";
import { isValidIconName } from "@/lib/icons"
import { BuildingMenu, BuildingStatusbar } from "@/widgets"

export default function Building() {
  const { buildingId } = useParams()
  const { storages } = useStorageStore()
  const bins = useBinStore((s) => s.bins)
  const binItems = useItemStore((s) => s.binItems)
  const { locationSystems } = useLocationSystemStore()
  const { searchQuery } = useSearchStore()

  const selectedBinId = useBinStore((s) => s.selectedBinId)
  const setSelectedBinId = useBinStore((s) => s.setSelectedBinId)
  const activeBin = bins.find((bin) => bin.id === selectedBinId) ?? null

  const [sheetOpen, setSheetOpen] = useState(false)
  const [scrollX, setScrollX] = useState(0)
  const [scrollY, setScrollY] = useState(0)
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight })
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // Track window size changes with debounce
  useEffect(() => {
    let timeoutId: number;
    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setWindowSize({ width: window.innerWidth, height: window.innerHeight });
      }, 150);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, []);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget
    setScrollX(target.scrollLeft)
    setScrollY(target.scrollTop)
  }



  // Get the storage for this building
  const storage = storages.find((s) => s.buildingId === buildingId)
  const locationSystem = locationSystems.find((ls) => ls.id === storage?.locationSystemId)



  if (!storage) {
    return (
      <div className="flex flex-col h-screen bg-background">
        <BuildingMenu />
        <div className="flex-1 min-h-0 overflow-hidden flex items-center justify-center">
          <p className="text-muted-foreground">No storage found for this building</p>
        </div>
        <BuildingStatusbar />
      </div>
    )
  }

  // Get bins for this storage
  const storageBins = bins.filter((bin) => bin.storageId === storage.id)

  if (storageBins.length === 0) {
    return (
      <div className="flex flex-col h-screen bg-background">
        <BuildingMenu />
        <div className="flex-1 min-h-0 overflow-hidden flex items-center justify-center">
          <p className="text-muted-foreground">No bins found, please add them</p>
        </div>
        <BuildingStatusbar />
      </div>
    )
  }

  // Calculate matching bins for search highlighting
  const matchingBinIds = useMemo(() => {
    if (!searchQuery.trim()) return new Set<string>()

    const query = searchQuery.toLowerCase().trim()
    return new Set(
      storageBins
        .filter((bin) =>
          bin.locationCode.toLowerCase().includes(query) ||
          bin.name.toLowerCase().includes(query)
        )
        .map((bin) => bin.id)
    )
  }, [searchQuery, storageBins])

  // Get grid dimensions from location system config
  const racksPerColumn = locationSystem?.gridConfig?.racksPerColumn ?? 5
  const rowPrefix = locationSystem?.gridConfig?.rowPrefix ?? "L"
  const colPrefix = locationSystem?.gridConfig?.columnPrefix ?? ""

  const rows = racksPerColumn
  const columns = Math.max(
    1,
    storage.maxColumn + 1,
    Math.ceil(storageBins.length / racksPerColumn)
  )

  // Organize bins into grid using canonical coordinates
  const grid = organizeBinsIntoGrid(storageBins, rows, columns)

  // Generate labels based on location system prefixes
  const colLabels = Array.from({ length: columns }, (_, i) =>
    `${colPrefix}${String(i + 1).padStart(2, '0')}`
  )
  const rowLabels = Array.from({ length: rows }, (_, i) =>
    `${rowPrefix}${String(i + 1).padStart(2, '0')}`
  )

  // Calculate if grid needs spreadsheet mode (too large to fit comfortably)
  const gridWidth = columns * 76 + 64 + 4; // bins + row labels + padding
  const gridHeight = rows * 76 + 40 + 4; // bins + column labels + padding
  const needsSpreadsheetMode = gridWidth > windowSize.width * 0.9 || gridHeight > windowSize.height * 0.9;

  return (
    <div className="flex flex-col h-screen bg-background">
      <BuildingMenu />
      <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
        <div className={`flex items-center justify-center w-full flex-1 min-h-0 ${needsSpreadsheetMode ? "p-2" : "p-4"}`}>
          {needsSpreadsheetMode ? (
            // Spreadsheet mode: frozen headers, scrollable, with border
            <div
              className="relative border border-border rounded-lg overflow-hidden bg-background w-full h-full"
            >
              {/* Fixed top-left corner */}
              <div className="absolute top-0 left-0 z-30 bg-background border-r border-b border-border">
                <div className="w-16 h-10 flex items-center justify-center" />
              </div>

              {/* Fixed column headers (scrolls horizontally with grid) */}
              <div className="absolute top-0 left-16 right-0 z-20 bg-background border-b border-border overflow-hidden">
                <div
                  className="flex gap-2 py-2"
                  style={{
                    transform: `translateX(-${scrollX}px)`,
                    width: `${columns * 76}px`
                  }}
                >
                  {colLabels.map((colLabel) => (
                    <div
                      key={`col-${colLabel}`}
                      className="flex items-center justify-center text-xs text-muted-foreground font-medium select-none"
                      style={{ width: '70px', minWidth: '70px' }}
                    >
                      {colLabel}
                    </div>
                  ))}
                </div>
              </div>

              {/* Fixed row labels (scrolls vertically with grid) */}
              <div className="absolute top-10 left-0 bottom-0 z-20 bg-background border-r border-border overflow-hidden">
                <div
                  style={{
                    transform: `translateY(-${scrollY}px)`,
                    height: `${rows * 76}px`
                  }}
                >
                  {rowLabels.map((rowLabel, index) => (
                    <div
                      key={`row-${rowLabel}`}
                      className="flex items-center justify-end pr-3 text-xs text-muted-foreground font-medium select-none"
                      style={{
                        height: '70px',
                        minHeight: '70px',
                        width: '64px',
                        marginTop: index === 0 ? '0' : '6px'
                      }}
                    >
                      {rowLabel}
                    </div>
                  ))}
                </div>
              </div>

              {/* Scrollable grid area */}
              <div
                ref={scrollContainerRef}
                className="absolute top-10 left-16 right-0 bottom-0 overflow-auto"
                onScroll={handleScroll}
              >
                <div
                  className="grid gap-2"
                  style={{
                    gridTemplateColumns: `repeat(${columns}, 70px)`,
                    gridTemplateRows: `repeat(${rows}, 70px)`,
                    width: `${columns * 76 - 6}px`,
                    height: `${rows * 76 - 6}px`,
                  }}
                >
                  {rowLabels.map((_, rowIndex) =>
                    colLabels.map((_, colIndex) => {
                      const bin = grid[rowIndex]?.[colIndex];

                      if (!bin) {
                        return (
                          <div
                            key={`empty-${colIndex}-${rowIndex}`}
                            className="w-17.5 h-17.5"
                          />
                        );
                      }

                      const binItemCount = binItems.filter(bi => bi.binId === bin.id).length;
                      const totalBinItemQuantity = binItems
                        .filter(bi => bi.binId === bin.id)
                        .reduce((sum, bi) => sum + bi.quantity, 0);
                      const binState = getBinState(bin, binItemCount, totalBinItemQuantity);

                      const isMatching = matchingBinIds.has(bin.id);
                      const isSearchActive = searchQuery.trim().length > 0;

                      return (
                        <div
                          key={bin.id}
                          onClick={() => {
                            setSelectedBinId(bin.id);
                            setSheetOpen(true);
                          }}
                          className={`flex items-center justify-center w-17.5 h-17.5 rounded-[20px] transition-all cursor-pointer ${isSearchActive
                            ? isMatching
                              ? "bg-bin-empty ring-2 ring-primary scale-105"
                              : "bg-bin-empty opacity-50"
                            : `${binState === "stocked"
                              ? "bg-bin-stocked"
                              : binState === "outOfStock"
                                ? "bg-bin-out-of-stock"
                                : binState === "outOfService"
                                  ? "bg-bin-out-of-service"
                                  : "bg-bin-empty"
                            } hover:ring-1 hover:ring-border`
                          }`}
                        >
                          {isValidIconName(bin.icon) && (
                            <BinIcon iconName={bin.icon} size={24} strokeWidth={1.75} />
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          ) : (
            // Simple centered mode: no scrolling, no border, clean and minimal
            // eslint-disable-next-line no-unused-vars
            <div
              className="inline-grid gap-2 items-center"
              style={{
                gridTemplateColumns: `auto repeat(${columns}, minmax(0, 1fr))`,
              }}
            >
              {/* Row 0: Empty Top-Left Corner + Column Numbers */}
              <div />
              {colLabels.map((colLabel) => (
                <div
                  key={`col-${colLabel}`}
                  className="flex items-center justify-center text-xs text-muted-foreground font-medium pb-1 select-none"
                >
                  {colLabel}
                </div>
              ))}

              {/* Rows: Level Label on Left + Bin Cards */}
              {rowLabels.map((rowLabel, rowIndex) => (
                <React.Fragment key={`row-${rowLabel}`}>
                  {/* Column 1: Y-Axis Level Label */}
                  <div className="flex items-center justify-end pr-3 text-xs text-muted-foreground font-medium select-none">
                    {rowLabel}
                  </div>

                  {/* Columns: Bin Cards for this Level */}
                  {colLabels.map((_, colIndex) => {
                    const bin = grid[rowIndex]?.[colIndex];

                    if (!bin) {
                      return (
                        <div
                          key={`empty-${colIndex}-${rowIndex}`}
                          className="w-17.5 h-17.5"
                        />
                      );
                    }

                    const binItemCount = binItems.filter(bi => bi.binId === bin.id).length;
                    const totalBinItemQuantity = binItems
                      .filter(bi => bi.binId === bin.id)
                      .reduce((sum, bi) => sum + bi.quantity, 0);
                    const binState = getBinState(bin, binItemCount, totalBinItemQuantity);

                    const isMatching = matchingBinIds.has(bin.id);
                    const isSearchActive = searchQuery.trim().length > 0;

                    return (
                      <div
                        key={bin.id}
                        onClick={() => {
                          setSelectedBinId(bin.id);
                          setSheetOpen(true);
                        }}
                        className={`flex items-center justify-center w-17.5 h-17.5 rounded-[20px] transition-all cursor-pointer ${isSearchActive
                          ? isMatching
                            ? "bg-bin-empty ring-2 ring-primary scale-105"
                            : "bg-bin-empty opacity-50"
                          : `${binState === "stocked"
                            ? "bg-bin-stocked"
                            : binState === "outOfStock"
                              ? "bg-bin-out-of-stock"
                              : binState === "outOfService"
                                ? "bg-bin-out-of-service"
                                : "bg-bin-empty"
                          } hover:ring-1 hover:ring-border`
                        }`}
                      >
                        {isValidIconName(bin.icon) && (
                          <BinIcon iconName={bin.icon} size={24} strokeWidth={1.75} />
                        )}
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
          )}
        </div>
      </div>
      <BuildingStatusbar />

      <BinDetailSheet
        bin={activeBin}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </div>
  );
}
