import React, { useMemo, useState } from "react"
import { useBinStore, useStorageStore, useLocationSystemStore, useSearchStore } from "@bino/store"
import { organizeBinsIntoGrid } from "@bino/data"
import { useParams } from "react-router-dom"
import { BinDetailSheet } from "@/features/building/components/BinDetailSheet"
export default function Building() {
  const { buildingId } = useParams()
  const { storages } = useStorageStore()
  const bins = useBinStore((s) => s.bins)
  const { locationSystems } = useLocationSystemStore()
  const { searchQuery } = useSearchStore()

  const selectedBinId = useBinStore((s) => s.selectedBinId)
  const setSelectedBinId = useBinStore((s) => s.setSelectedBinId)
  const activeBin = bins.find((bin) => bin.id === selectedBinId) ?? null

  const [sheetOpen, setSheetOpen] = useState(false)



  // Get the storage for this building
  const storage = storages.find((s) => s.buildingId === buildingId)
  const locationSystem = locationSystems.find((ls) => ls.id === storage?.locationSystemId)



  if (!storage) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <p className="text-muted-foreground">No storage found for this building</p>
      </div>
    )
  }

  // Get bins for this storage
  const storageBins = bins.filter((bin) => bin.storageId === storage.id)

  if (storageBins.length === 0) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <p className="text-muted-foreground">No bins found, please add them</p>
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

  return (
    <div className="flex items-center justify-center w-full h-full">
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

        {/* Rows: Level Label on Left (L01..L05) + Bin Cards */}
        {rowLabels.map((rowLabel, rowIndex) => (
          <React.Fragment key={`row-${rowLabel}`}>
            {/* Column 1: Y-Axis Level Label */}
            <div className="flex items-center justify-end pr-3 text-xs text-muted-foreground font-medium select-none">
              {rowLabel}
            </div>

            {/* Columns: Bin Cards for this Level */}
            {colLabels.map((_, colIndex) => {
              const bin = grid[rowIndex]?.[colIndex]

              if (!bin) {
                return (
                  <div
                    key={`empty-${colIndex}-${rowIndex}`}
                    className="w-17.5 h-17.5"
                  />
                )
              }

              const isMatching = matchingBinIds.has(bin.id)
              const isSearchActive = searchQuery.trim().length > 0

              return (
                <div
                  key={bin.id}
                  onClick={() => {
                    setSelectedBinId(bin.id)
                    setSheetOpen(true)
                  }}
                  className={`flex items-center justify-center w-17.5 h-17.5 rounded-[20px] transition-all cursor-pointer ${isSearchActive
                    ? isMatching
                      ? "bg-bin-empty ring-2 ring-primary scale-105"
                      : "bg-bin-empty opacity-30"
                    : "bg-bin-empty hover:ring-1 hover:ring-border"
                    }`}
                >
                  <h5 className="select-none">{bin.locationCode}</h5>
                </div>
              )
            })}
          </React.Fragment>
        ))}
      </div>

      <BinDetailSheet
        bin={activeBin}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />
    </div>
  )
}
