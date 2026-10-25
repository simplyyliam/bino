import * as React from "react"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"
import { cva, type VariantProps } from "class-variance-authority"
import { XIcon } from "lucide-react"

import { cn } from "../../lib/utils"
import { Button } from "./button"

function Sheet({ ...props }: DialogPrimitive.Root.Props) {
  return <DialogPrimitive.Root data-slot="sheet" {...props} />
}

function SheetTrigger({ ...props }: DialogPrimitive.Trigger.Props) {
  return <DialogPrimitive.Trigger data-slot="sheet-trigger" {...props} />
}

function SheetPortal({ ...props }: DialogPrimitive.Portal.Props) {
  return <DialogPrimitive.Portal data-slot="sheet-portal" {...props} />
}

function SheetClose({ ...props }: DialogPrimitive.Close.Props) {
  return <DialogPrimitive.Close data-slot="sheet-close" {...props} />
}

function SheetOverlay({
  className,
  ...props
}: DialogPrimitive.Backdrop.Props) {
  return (
    <DialogPrimitive.Backdrop
      data-slot="sheet-overlay"
      className={cn(
        "fixed inset-0 isolate z-50 bg-black/20 duration-200 data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0 dark:bg-black/45",
        className
      )}
      {...props}
    />
  )
}

// Sheets float slightly off the window edge, like an inspector panel.
const sheetVariants = cva(
  "fixed z-50 flex flex-col bg-popover text-popover-foreground shadow-raised outline-none ease-[cubic-bezier(0.2,0.9,0.3,1)] data-open:animate-in data-open:duration-300 data-closed:animate-out data-closed:duration-200",
  {
    variants: {
      side: {
        right:
          "inset-y-2 right-2 w-[calc(100%-1rem)] rounded-2xl sm:max-w-[26rem] data-closed:slide-out-to-right-8 data-closed:fade-out-0 data-open:slide-in-from-right-8 data-open:fade-in-0",
        left:
          "inset-y-2 left-2 w-[calc(100%-1rem)] rounded-2xl sm:max-w-sm data-closed:slide-out-to-left-8 data-closed:fade-out-0 data-open:slide-in-from-left-8 data-open:fade-in-0",
        bottom:
          "inset-x-0 bottom-0 rounded-t-2xl data-closed:slide-out-to-bottom data-open:slide-in-from-bottom",
        top: "inset-x-0 top-0 rounded-b-2xl data-closed:slide-out-to-top data-open:slide-in-from-top",
      },
    },
    defaultVariants: {
      side: "right",
    },
  }
)

interface SheetContentProps
  extends DialogPrimitive.Popup.Props,
    VariantProps<typeof sheetVariants> {
  showCloseButton?: boolean
  showOverlay?: boolean
}

function SheetContent({
  className,
  children,
  side = "right",
  showCloseButton = true,
  showOverlay = true,
  ...props
}: SheetContentProps) {
  return (
    <SheetPortal>
      {showOverlay && <SheetOverlay />}
      <DialogPrimitive.Popup
        data-slot="sheet-content"
        className={cn(sheetVariants({ side }), className)}
        {...props}
      >
        {children}
        {showCloseButton && (
          <DialogPrimitive.Close
            data-slot="sheet-close"
            render={
              <Button
                variant="ghost"
                className="absolute top-4 right-4 text-muted-foreground"
                size="icon-sm"
              />
            }
          >
            <XIcon />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Popup>
    </SheetPortal>
  )
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-header"
      className={cn("flex flex-col gap-1 p-5 pr-14", className)}
      {...props}
    />
  )
}

function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn("mt-auto flex gap-2 border-t border-border p-4", className)}
      {...props}
    />
  )
}

function SheetTitle({ className, ...props }: DialogPrimitive.Title.Props) {
  return (
    <DialogPrimitive.Title
      data-slot="sheet-title"
      className={cn("text-base font-semibold tracking-tight text-foreground", className)}
      {...props}
    />
  )
}

function SheetDescription({
  className,
  ...props
}: DialogPrimitive.Description.Props) {
  return (
    <DialogPrimitive.Description
      data-slot="sheet-description"
      className={cn("text-[13px] text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetOverlay,
  SheetPortal,
  SheetTitle,
  SheetTrigger,
}
