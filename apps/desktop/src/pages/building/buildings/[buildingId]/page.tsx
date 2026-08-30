import React from "react"
import { useBinStore, useStorageStore } from "@bino/store"
import { organizeBinsIntoGrid } from "@bino/data"
import { useParams } from "react-router-dom"

export default function Building() {
  const { buildingId } = useParams()
  const { storages } = useStorageStore()
  const { bins } = useBinStore()

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

  // Use canonical dimensions from storage
  const rows = storage.maxRow + 1  // maxRow is 0-indexed
  const columns = storage.maxColumn + 1  // maxColumn is 0-indexed

  // Organize bins into grid using canonical coordinates
  const grid = organizeBinsIntoGrid(storageBins, rows, columns)

  // Generate labels
  const colLabels = Array.from({ length: columns }, (_, i) => String(i + 1).padStart(2, '0'))
  const rowLabels = Array.from({ length: rows }, (_, i) => `L${String(rows - i).padStart(2, '0')}`)

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

        {/* Rows: Level Label on Left + Bin Cards */}
        {rowLabels.map((rowLabel, displayRowIndex) => {
          // Reverse row index to display from top to bottom (L05, L04, L03, L02, L01)
          const actualRowIndex = rows - 1 - displayRowIndex

          return (
            <React.Fragment key={`row-${rowLabel}`}>
              {/* Column 1: Y-Axis Level Label */}
              <div className="flex items-center justify-end pr-3 text-xs text-muted-foreground font-medium select-none">
                {rowLabel}
              </div>

              {/* Columns: Bin Cards for this Level */}
              {colLabels.map((_, colIndex) => {
                const bin = grid[actualRowIndex]?.[colIndex]

                if (!bin) {
                  return (
                    <div
                      key={`empty-${colIndex}-${actualRowIndex}`}
                      className="w-17.5 h-17.5"
                    />
                  )
                }

                return (
                  <div
                    key={bin.id}
                    className="flex items-center justify-center w-17.5 h-17.5 bg-bin-empty rounded-[20px]"
                  >
                    <h5>{bin.locationCode}</h5>
                  </div>
                )
              })}
            </React.Fragment>
          )
        })}
      </div>
    </div>
  )
}
