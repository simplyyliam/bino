import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "../../lib/utils"

export const inputClassName =
  "h-9 w-full min-w-0 rounded-lg border border-input bg-card px-3 text-[13px] text-foreground shadow-[0_1px_2px_oklch(0_0_0/0.03)] transition-[border-color,box-shadow] duration-150 outline-none placeholder:text-muted-foreground/80 focus-visible:border-primary focus-visible:ring-3 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/15 dark:bg-input/20"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        inputClassName,
        type === "number" && "tabular-nums",
        className
      )}
      {...props}
    />
  )
}

export { Input }
