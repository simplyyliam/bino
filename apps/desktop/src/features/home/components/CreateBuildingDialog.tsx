import { useBuildingStore, useStorageStore, useLocationSystemStore } from "@bino/store"
import { DialogContent, DialogHeader, Label, DialogFooter, Button, Dialog, DialogClose, DialogDescription, DialogTitle, DialogTrigger, Input } from "@bino/ui"
import { useState } from "react"

type CreateBuildingDialogProps = {
  trigger: React.ReactElement;
};

export const CreateBuildingDialog = ({trigger}: CreateBuildingDialogProps) => {
  const addBuilding = useBuildingStore((state) => state.addBuilding)
  const addStorage = useStorageStore((state) => state.addStorage)
  const locationSystems = useLocationSystemStore((state) => state.locationSystems)

  const [name, setName] = useState("")
  const [buildingNumber, setBuildingNumber] = useState("")
  const [locationSystemId, setLocationSystemId] = useState(locationSystems[1]?.id || "") // Default to Bino's system

  const handleCreateBuilding = () => {
    if (!name.trim() || !buildingNumber.trim() || !locationSystemId) return

    const buildingId = crypto.randomUUID()

    // Create the building
    addBuilding({
      id: buildingId,
      name: name.trim(),
      buildingNumber: buildingNumber.trim(),
    })

    // Create default storage for this building
    addStorage({
      id: crypto.randomUUID(),
      buildingId,
      name: "Main Storage",
      locationSystemId,
      maxLevel: 0,
      maxRow: 0,
      maxColumn: 0
    })

    // Reset form
    setName("")
    setBuildingNumber("")
    setLocationSystemId(locationSystems[1]?.id || "")
  }

  const selectedSystem = locationSystems.find(s => s.id === locationSystemId)

  return (
    <Dialog>
      <DialogTrigger render={trigger} />

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Building</DialogTitle>
          <DialogDescription>
            Add a new building. A storage area will be created automatically, and you can start adding bins right away.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="building-name">Building name</Label>
            <Input
              id="building-name"
              placeholder="e.g. Main Warehouse"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="building-number">Building number</Label>
            <Input
              id="building-number"
              placeholder="e.g. 01"
              value={buildingNumber}
              onChange={(e) => setBuildingNumber(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="location-system">Location System</Label>
            <select
              id="location-system"
              value={locationSystemId}
              onChange={(e) => setLocationSystemId(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              {locationSystems.map((system) => (
                <option key={system.id} value={system.id}>
                  {system.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              {selectedSystem?.usesExistingCodes
                ? "Your existing location codes will be preserved"
                : "Bino will generate location codes automatically"}
            </p>
          </div>
        </div>

        <DialogFooter>
          <DialogClose render={<Button variant="outline">Cancel</Button>} />

          <DialogClose
            render={
              <Button onClick={handleCreateBuilding} disabled={!name.trim() || !buildingNumber.trim()}>
                Create Building
              </Button>
            }
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
