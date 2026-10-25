import * as React from "react"
import { Input as InputPrimitive } from "@base-ui/react/input"

import { cn } from "../../lib/utils"

export const inputClassName =
  "h-9 w-full min-w-0 rounded-xl border border-transparent bg-field px-3 text-[13px] text-foreground transition-[background-color,border-color,box-shadow] duration-150 outline-none placeholder:text-faint-foreground hover:bg-[color-mix(in_oklch,var(--field),var(--foreground)_3%)] focus-visible:border-input focus-visible:bg-background focus-visible:ring-3 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive"

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
