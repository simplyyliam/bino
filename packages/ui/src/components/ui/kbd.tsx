import * as React from "react"

import { cn } from "../../lib/utils"

function Kbd({ className, ...props }: React.ComponentProps<"kbd">) {
  return (
    <kbd
      data-slot="kbd"
      className={cn(
        "pointer-events-none inline-flex h-5 min-w-5 items-center justify-center gap-0.5 rounded-md bg-surface px-1.5 font-sans text-[11px] font-medium text-muted-foreground select-none in-data-[slot=tooltip-content]:bg-background/15 in-data-[slot=tooltip-content]:text-background",
        className
      )}
      {...props}
    />
  )
}

export { Kbd }
