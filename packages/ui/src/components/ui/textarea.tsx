import * as React from "react"

import { cn } from "../../lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-18 w-full resize-none rounded-lg border border-input bg-card px-3 py-2 text-[13px] shadow-[0_1px_2px_oklch(0_0_0/0.03)] transition-[border-color,box-shadow] duration-150 outline-none placeholder:text-muted-foreground/80 focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive dark:bg-input/20",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
