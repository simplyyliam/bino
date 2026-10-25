import { Toaster as Sonner, toast } from "sonner"

type ToasterProps = { theme?: "light" | "dark" | "system" }

function Toaster({ theme = "system" }: ToasterProps) {
  return (
    <Sonner
      theme={theme}
      position="bottom-center"
      gap={8}
      visibleToasts={3}
      toastOptions={{
        classNames: {
          toast:
            "!rounded-xl !border-0 !bg-foreground !text-background !shadow-raised !text-[13px] !py-3 !px-4 !gap-3 !font-sans",
          description: "!text-background/70",
          actionButton:
            "!bg-background/15 !text-background !rounded-md !px-2.5 !h-7 !text-[13px] !font-medium hover:!bg-background/25",
          icon: "!text-background",
        },
      }}
    />
  )
}

export { Toaster, toast }
