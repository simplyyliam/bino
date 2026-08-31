import { IconButton } from "@/shared/components"
import { Minus, Plus } from "@hugeicons/core-free-icons"

interface SettingProps {
  label: string
  value: number
  onIncrement?: () => void
  onDecrement?: () => void
  min?: number
  max?: number
  disabled?: boolean
}

export const ConfigSetting = ({
  label,
  value,
  onIncrement,
  onDecrement,
  min = 0,
  max = 999,
  disabled = false
}: SettingProps) => {
  return (
    <div className="flex items-center justify-between">
      <label className="text-sm font-medium">{label}</label>
      <div className="flex items-center gap-1.5">
        <IconButton
          Icon={Minus}
          size={14}
          onClick={onDecrement}
          disabled={disabled || value <= min}
          ariaLabel={`Decrease ${label}`}
        />
        <div className="flex h-7 min-w-10 items-center justify-center rounded-md border border-input px-2 text-sm font-medium tabular-nums select-none">
          {value}
        </div>
        <IconButton
          Icon={Plus}
          size={14}
          onClick={onIncrement}
          disabled={disabled || value >= max}
          ariaLabel={`Increase ${label}`}
        />
      </div>
    </div>
  )
}
