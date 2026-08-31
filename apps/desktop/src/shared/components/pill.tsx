interface PillProps {
  label: string
  value?: string | number
  status?: boolean
  className?: string
}

export const Pill = ({ label, value, status = false, className }: PillProps) => {
  return (
    <div
      data-slot="pill"
      className={`flex items-center justify-center gap-2.5 px-3 py-1.5 bg-muted border rounded-md ${className ?? ""}`}
    >
      <h6 data-slot="pill-label" className="text-xs">
        {label}
      </h6>

      {status && (
        <h6 data-slot="pill-value" className="text-xs">
          {value}
        </h6>
      )}
    </div>
  )
}