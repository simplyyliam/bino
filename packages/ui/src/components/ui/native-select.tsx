import * as React from "react"
import { ChevronDownIcon } from "lucide-react"

import { cn } from "../../lib/utils"

// A styled native <select>. Native is the right call for short option lists:
// keyboard, screen readers and type-to-select all come for free.
function NativeSelect({ className, children, ...props }: React.ComponentProps<"select">) {
  return (
    <div className={cn("relative", className)}>
      <select
        data-slot="native-select"
        className="h-9 w-full appearance-none rounded-lg border border-input bg-card pr-8 pl-3 text-[13px] text-foreground shadow-[0_1px_2px_oklch(0_0_0/0.03)] transition-[border-color,box-shadow] duration-150 outline-none focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-ring/40 disabled:opacity-50 dark:bg-input/20"
        {...props}
      >
        {children}
      </select>
      <ChevronDownIcon className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  )
}

export { NativeSelect }
