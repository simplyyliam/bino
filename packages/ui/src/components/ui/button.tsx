import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/utils"

const buttonVariants = cva(
  "group/button relative inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full border border-transparent bg-clip-padding font-medium whitespace-nowrap outline-none select-none transition-[background-color,border-color,color,box-shadow,scale] duration-150 ease-out focus-visible:ring-3 focus-visible:ring-ring active:not-aria-[haspopup]:not-disabled:scale-[0.97] disabled:pointer-events-none disabled:opacity-45 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-[0_1px_2px_oklch(0_0_0/0.12)] hover:bg-[color-mix(in_oklch,var(--primary),var(--background)_14%)]",
        outline:
          "bg-card text-foreground shadow-pill hover:bg-surface aria-expanded:bg-surface",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_6%)] aria-expanded:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_6%)]",
        ghost:
          "text-muted-foreground hover:bg-accent hover:text-foreground aria-expanded:bg-accent aria-expanded:text-foreground",
        destructive:
          "bg-destructive text-white shadow-[inset_0_1px_0_oklch(1_0_0/0.14),0_1px_2px_oklch(0_0_0/0.12)] hover:bg-[color-mix(in_oklch,var(--destructive),black_8%)] focus-visible:ring-destructive/40",
        "destructive-ghost":
          "text-destructive hover:bg-destructive/10 focus-visible:ring-destructive/30",
        link: "h-auto! px-0! text-accent-blue underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 text-[13px]",
        sm: "h-8 px-3 text-[13px]",
        xs: "h-7 px-2.5 text-xs [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-10 px-4 text-sm",
        icon: "size-9",
        "icon-sm": "size-8",
        "icon-xs": "size-7 [&_svg:not([class*='size-'])]:size-3.5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
