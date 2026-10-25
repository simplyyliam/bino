import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, Kbd } from "@bino/ui";
import { useUiStore } from "@bino/store";
import { modKey } from "@/lib/format";

const GROUPS: { title: string; keys: { keys: string[]; label: string }[] }[] = [
  {
    title: "Anywhere",
    keys: [
      { keys: [modKey, "K"], label: "Search everything" },
      { keys: ["/"], label: "Search everything" },
      { keys: ["G", "O"], label: "Go to Overview" },
      { keys: ["G", "I"], label: "Go to Items" },
      { keys: ["G", "A"], label: "Go to Activity" },
      { keys: ["C"], label: "Create (building, item…)" },
      { keys: [modKey, "\\"], label: "Show or hide the sidebar" },
      { keys: ["?"], label: "This list" },
    ],
  },
  {
    title: "In a building",
    keys: [
      { keys: ["←", "↑", "→", "↓"], label: "Move between bins" },
      { keys: ["↵"], label: "Open the bin" },
      { keys: ["Esc"], label: "Close the bin" },
      { keys: ["F"], label: "Find in this building" },
      { keys: ["L"], label: "Edit layout" },
    ],
  },
  {
    title: "Quantities",
    keys: [
      { keys: ["↑", "↓"], label: "Add or take one while typing" },
      { keys: ["↵"], label: "Save" },
      { keys: ["Esc"], label: "Cancel" },
    ],
  },
];

export function ShortcutsDialog() {
  const open = useUiStore((s) => s.shortcutsOpen);
  const setOpen = useUiStore((s) => s.setShortcutsOpen);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription>Everything in Bino works with a mouse too. These just make it quicker.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-5">
          {GROUPS.map((group) => (
            <section key={group.title} className="flex flex-col gap-1">
              <h3 className="mb-1 text-xs font-medium text-muted-foreground">{group.title}</h3>
              {group.keys.map((k) => (
                <div key={k.label + k.keys.join()} className="flex items-center justify-between py-1 text-[13px]">
                  <span>{k.label}</span>
                  <span className="flex gap-1">
                    {k.keys.map((key) => (
                      <Kbd key={key}>{key}</Kbd>
                    ))}
                  </span>
                </div>
              ))}
            </section>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
