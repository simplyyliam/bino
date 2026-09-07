import { IconButton } from "@/shared/components"
import { Minus, Plus } from "@hugeicons/core-free-icons"

interface SettingProps {
  label: string
  value: number
  onIncrement?: () => void
  onDecrement?: () => void
  onValueChange?: (value: number) => void | Promise<void>
  min?: number
  max?: number
  disabled?: boolean
}

export const ConfigSetting = ({
  label,
  value,
  onIncrement,
  onDecrement,
  onValueChange,
  min = 0,
  max = 999,
  disabled = false
}: SettingProps) => {
  const commitValue = (input: HTMLInputElement) => {
    const parsedValue = Number.parseInt(input.value, 10)
    const nextValue = Number.isNaN(parsedValue)
      ? value
      : Math.min(max, Math.max(min, parsedValue))

    input.value = String(nextValue)
    if (nextValue !== value) void onValueChange?.(nextValue)
  }

  return (
    <div className="flex items-center justify-between">
      <label className="text-sm font-medium" htmlFor={`${label}-value`}>
        {label}
      </label>
      <div className="flex items-center gap-1.5">
        <IconButton
          Icon={Minus}
          size={14}
          onClick={onDecrement}
          disabled={disabled || value <= min}
          ariaLabel={`Decrease ${label}`}
        />
        <input
          id={`${label}-value`}
          type="number"
          inputMode="numeric"
          key={value}
          defaultValue={value}
          min={min}
          max={max}
          disabled={disabled || !onValueChange}
          onBlur={(event) => commitValue(event.currentTarget)}
          onKeyDown={(event) => {
            if (event.key === "Enter") event.currentTarget.blur()
            if (event.key === "Escape") {
              event.currentTarget.value = String(value)
              event.currentTarget.blur()
            }
          }}
          className="h-7 w-12 rounded-md border border-input bg-background px-1 text-center text-sm font-medium tabular-nums outline-none transition-shadow focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:bg-muted/50 disabled:opacity-70 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [&::-moz-number-input-spinner]:display-none"
          style={{ appearance: "textfield" }}
          aria-label={`${label} value`}
        />
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
