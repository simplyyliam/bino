import React, { useMemo } from "react"
import { useBinStore, useStorageStore, useSearchStore } from "@bino/store"
import { organizeBinsIntoGrid } from "@bino/data"
import { useParams } from "react-router-dom"

export default function Building() {
  const { buildingId } = useParams()
  const { storages } = useStorageStore()
  const { bins } = useBinStore()
  const { searchQuery } = useSearchStore()

  // Get the storage for this building
  const storage = storages.find((s) => s.buildingId === buildingId)

  if (!storage) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <p className="text-muted-foreground">No storage found for this building</p>
      </div>
    )
  }

  // Get bins for this storage
  const storageBins = bins.filter((bin) => bin.storageId === storage.id)

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

  // A rack standard is 5 vertical shelves (L01 to L05)
  const racksPerColumn = 5
  const rows = racksPerColumn  // Always 5 rows (L01 to L05)
  const columns = Math.max(
    1,
    storage.maxColumn + 1,
    Math.ceil(storageBins.length / racksPerColumn)
  )

  // Organize bins into grid using canonical coordinates
  const grid = organizeBinsIntoGrid(storageBins, rows, columns)

  // Generate labels (Columns: 01, 02... | Rows: L01, L02... L05)
  const colLabels = Array.from({ length: columns }, (_, i) => String(i + 1).padStart(2, '0'))
  const rowLabels = Array.from({ length: rows }, (_, i) => `L${String(i + 1).padStart(2, '0')}`)

  return (
    <div className="flex items-center justify-center w-full h-full typeset typeset-docs">
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
                  className={`flex items-center justify-center w-17.5 h-17.5 rounded-[20px] transition-all cursor-pointer ${
                    isSearchActive
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
    </div>
  )
}
