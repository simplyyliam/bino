import * as React from "react"

import { cn } from "../../lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-18 w-full resize-none rounded-xl border border-transparent bg-field px-3 py-2 text-[13px] transition-[background-color,border-color,box-shadow] duration-150 outline-none placeholder:text-faint-foreground focus-visible:border-input focus-visible:bg-background focus-visible:ring-3 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
