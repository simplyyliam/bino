import { useBuildingStore, useStorageStore, useLocationSystemStore } from "@bino/store"
import {
  DialogContent,
  DialogHeader,
  Label,
  DialogFooter,
  Button,
  Dialog,
  DialogClose,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
  Input
} from "@bino/ui"
import { generateLocationCode } from "@bino/data"
import { useState, useMemo } from "react"
import { LocationSystemEditorDialog } from "@/features/building/components/LocationSystemEditorDialog"
import { HugeiconsIcon } from "@hugeicons/react"
import { Settings02Icon, PlusSignIcon } from "@hugeicons/core-free-icons"

type CreateBuildingDialogProps = {
  trigger: React.ReactElement;
};

export const CreateBuildingDialog = ({ trigger }: CreateBuildingDialogProps) => {
  const addBuilding = useBuildingStore((state) => state.addBuilding)
  const addStorage = useStorageStore((state) => state.addStorage)
  const locationSystems = useLocationSystemStore((state) => state.locationSystems)

  const [name, setName] = useState("")
  const [buildingNumber, setBuildingNumber] = useState("")
  const [locationSystemId, setLocationSystemId] = useState(
    locationSystems[0]?.id || ""
  )
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingSystemId, setEditingSystemId] = useState<string | null>(null)

  const selectedSystem = useMemo(
    () => locationSystems.find((s) => s.id === locationSystemId) || locationSystems[0],
    [locationSystems, locationSystemId]
  )

  // Calculate live preview code for the first bin
  const sampleCode = useMemo(() => {
    if (!selectedSystem) return ""
    try {
      return generateLocationCode(
        { level: 0, row: 0, column: 0, position: 0 },
        selectedSystem
      )
    } catch {
      return ""
    }
  }, [selectedSystem])

  const handleCreateBuilding = async () => {
    if (!name.trim() || !buildingNumber.trim() || !locationSystemId) return

    try {
      // Create the building - the API assigns the real id, use that for the storage below.
      const building = await addBuilding({
        name: name.trim(),
        buildingNumber: buildingNumber.trim(),
      })

      // Create default storage for this building with selected location system
      await addStorage({
        buildingId: building.id,
        name: "Main Storage",
        locationSystemId,
        maxLevel: 0,
        maxRow: 0,
        maxColumn: 0
      })

      // Reset form
      setName("")
      setBuildingNumber("")
      setLocationSystemId(locationSystems[0]?.id || "")
    } catch (err) {
      console.error("Failed to create building", err)
    }
  }

  const handleOpenEditor = (sysId: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    setEditingSystemId(sysId)
    setEditorOpen(true)
  }

  const handleAddNewSystem = (e: React.MouseEvent) => {
    e.stopPropagation()
    const newId = `custom-sys-${Date.now()}`
    setEditingSystemId(newId)
    setEditorOpen(true)
  }

  return (
    <>
      <Dialog>
        <DialogTrigger render={trigger} />

        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Building</DialogTitle>
            <DialogDescription>
              Configure your building and choose how storage locations will be identified.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-2">
            {/* Building Details */}
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 flex flex-col gap-1.5">
                <Label htmlFor="building-name">Building Name</Label>
                <Input
                  id="building-name"
                  placeholder="e.g. Main Warehouse"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <Label htmlFor="building-number">Number / Code</Label>
                <Input
                  id="building-number"
                  placeholder="e.g. 01"
                  value={buildingNumber}
                  onChange={(e) => setBuildingNumber(e.target.value)}
                />
              </div>
            </div>

            {/* Location System Selection */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="location-system">Location Code System</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleAddNewSystem}
                  className="h-6 text-[11px] px-2 gap-1 text-primary hover:text-primary"
                >
                  <HugeiconsIcon icon={PlusSignIcon} className="size-3" />
                  New System
                </Button>
              </div>

              <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-0.5">
                {locationSystems.map((system) => {
                  const isSelected = system.id === locationSystemId
                  const preview = generateLocationCode(
                    { level: 0, row: 0, column: 0, position: 0 },
                    system
                  )

                  return (
                    <div
                      key={system.id}
                      onClick={() => setLocationSystemId(system.id)}
                      className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition-all ${
                        isSelected
                          ? "border-primary bg-primary/5 ring-1 ring-primary"
                          : "border-border hover:border-muted-foreground/30 bg-card"
                      }`}
                    >
                      <div className="flex flex-col gap-0.5 min-w-0 pr-2">
                        <span className="text-xs font-semibold leading-tight truncate">
                          {system.name}
                        </span>
                        <span className="text-[11px] text-muted-foreground truncate">
                          {system.levels.map((l) => l.name).join(" → ")}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-muted text-foreground">
                          {preview}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          onClick={(e) => handleOpenEditor(system.id, e)}
                        >
                          <HugeiconsIcon icon={Settings02Icon} className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Live Code Preview Card */}
            {sampleCode && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border border-border/50 text-xs">
                <div className="flex flex-col">
                  <span className="font-medium text-foreground">First Bin Code Preview:</span>
                  <span className="text-[11px] text-muted-foreground">Generated when you add your first bin</span>
                </div>
                <span className="font-mono font-bold text-sm text-primary">
                  {sampleCode}
                </span>
              </div>
            )}
          </div>

          <DialogFooter>
            <DialogClose render={<Button variant="outline">Cancel</Button>} />

            <DialogClose
              render={
                <Button
                  onClick={handleCreateBuilding}
                  disabled={!name.trim() || !buildingNumber.trim()}
                >
                  Create Building
                </Button>
              }
            />
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <LocationSystemEditorDialog
        open={editorOpen}
        onOpenChange={setEditorOpen}
        systemId={editingSystemId || locationSystemId}
        onSaved={(savedSystem) => {
          setLocationSystemId(savedSystem.id);
        }}
      />
    </>
  )
}
