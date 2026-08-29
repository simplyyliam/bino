import React from "react"
import { Bins, Storages } from "@bino/data"
import { useParams } from "react-router-dom"

export default function Building() {
  const { buildingId } = useParams()
  const storageId = Storages.find((storage) => storage.buildingId === buildingId)
  const bins = Bins.filter((bin) => bin.storageId === storageId?.id)

  const racksPerColumn = 5;
  const colsCount = Math.ceil(bins.length / racksPerColumn) || 1;

  // X-Axis Column Labels (Top): ["01", "02", "03", "04", "05", "06", ...]
  const colLabels = Array.from({ length: colsCount }, (_, i) => String(i + 1).padStart(2, '0'))

  // Y-Axis Level Labels (Left, Top to Bottom): ["L05", "L04", "L03", "L02", "L01"]
  const rowLabels = Array.from({ length: racksPerColumn }, (_, i) => `L${String(racksPerColumn - i).padStart(2, '0')}`)

  return (
    <div className="flex items-center justify-center w-full h-full typeset typeset-docs">
      <div 
        className="inline-grid gap-2 items-center" 
        style={{
          gridTemplateColumns: `auto repeat(${colsCount}, minmax(0, 1fr))`,
        }}
      >
        {/* Row 0: Empty Top-Left Corner + Column Numbers (01, 02, 03, ...) */}
        <div />
        {colLabels.map((colLabel) => (
          <div 
            key={`col-${colLabel}`} 
            className="flex items-center justify-center text-xs text-muted-foreground font-medium pb-1 select-none"
          >
            {colLabel}
          </div>
        ))}

        {/* Rows 1..N: Level Label (L05, L04, ...) on Left + Bin Cards */}
        {rowLabels.map((rowLabel, rowIndex) => (
          <React.Fragment key={`row-${rowLabel}`}>
            {/* Column 1: Y-Axis Level Label */}
            <div className="flex items-center justify-end pr-3 text-xs text-muted-foreground font-medium select-none">
              {rowLabel}
            </div>

            {/* Columns 2..N: Bin Cards for this Level */}
            {colLabels.map((_, colIndex) => {
              const binIndex = colIndex * racksPerColumn + rowIndex;
              const bin = bins[binIndex];

              if (!bin) return <div key={`empty-${colIndex}-${rowIndex}`} />;

              return (
                <div 
                  key={bin.id} 
                  className="flex items-center justify-center w-17.5 h-17.5 bg-bin-empty rounded-[20px]"
                >
                  <h5>{bin.locationCode}</h5>
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  )
}
