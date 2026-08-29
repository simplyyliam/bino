interface PillProps {
  label: string
  value?: string
  status?: boolean
}

export const Pill = ({ label, value, status = false }: PillProps) => {
  return (
    <div className="flex items-center justify-center gap-2.5 px-3 py-1.5 bg-muted border rounded-md">
      <h6 className="text-xs">{label}</h6>
      {status && (
        <h6 className="text-xs">{value}</h6>
      )}
    </div>
  )
}
