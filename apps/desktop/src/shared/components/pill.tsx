import { cn } from "@bino/ui"

interface PillProps {
  label: string
  value?: string | number
  status?: boolean
  className?: string
}

export const Pill = ({
  label,
  value,
  status = false,
  className,
}: PillProps) => {
  return (
    <div
      data-slot="pill"
      className={cn(
        'h-7 gap-1 px-2 text-xs/relaxed has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 flex items-center justify-center border border-input rounded-md bg-muted/35',
        className,
      )}
    >
      <span data-slot="pill-label">{label}</span>

      {status && (
        <span data-slot="pill-value">{value}</span>
      )}
    </div>
  )
}