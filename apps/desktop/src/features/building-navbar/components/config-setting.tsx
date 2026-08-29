import { IconButton } from "@/shared/components"
import { Minus, Plus } from "@hugeicons/core-free-icons"

interface SettingProps {
  label: string
}

export const ConfigSetting = ({ label }: SettingProps) => {
  return (
    <div className="flex items-center justify-between">
      <label>{label}</label>
      <div className="flex items-center gap-1.5">
        <IconButton Icon={Minus} />
        <div className="flex h-7 w-fit items-center justify-center rounded-md border border-input px-3 text-sm font-medium">
          10
        </div>
        <IconButton Icon={Plus} />
      </div>
    </div>
  )
}
