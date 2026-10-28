import * as React from "react"
import { ChevronDownIcon } from "lucide-react"

import { cn } from "../../lib/utils"

const tones = {
  // Inside white containers: a soft filled field.
  field:
    "rounded-xl border border-transparent bg-field hover:bg-[color-mix(in_oklch,var(--field),var(--foreground)_3%)] focus-visible:border-input focus-visible:bg-background",
  // Toolbar filters.
  pill: "rounded-lg border border-transparent bg-field hover:bg-[color-mix(in_oklch,var(--field),var(--foreground)_3%)] focus-visible:border-input focus-visible:bg-background",
}

type NativeSelectProps = React.ComponentProps<"select"> & { tone?: keyof typeof tones }

// A styled native <select>. Native is the right call for short option lists:
// keyboard, screen readers and type-to-select all come for free.
function NativeSelect({ className, children, tone = "field", ...props }: NativeSelectProps) {
  return (
    <div className={cn("relative", className)}>
      <select
        data-slot="native-select"
        className={cn(
          "h-8 w-full appearance-none pr-8 pl-3.5 text-[13px] text-foreground outline-none transition-[background-color,border-color,box-shadow] duration-150 focus-visible:ring-3 focus-visible:ring-ring/30 disabled:opacity-50",
          tones[tone]
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDownIcon className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  )
}

export { NativeSelect }
