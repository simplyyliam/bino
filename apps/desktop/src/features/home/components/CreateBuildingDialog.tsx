import { useBuildingStore } from "@bino/store"
import { DialogContent, DialogHeader, Label, DialogFooter, Button, Dialog, DialogClose, DialogDescription, DialogTitle, DialogTrigger, Input } from "@bino/ui"
import { useState } from "react"

type CreateBuildingDialogProps = {
  trigger: React.ReactElement;
};

export const CreateBuildingDialog = ({trigger}: CreateBuildingDialogProps) => {
  const addBuilding = useBuildingStore((state) => state.addBuilding)

  const [name, setName] = useState("")
  const [buildingNumber, setBuildingNumber] = useState("")
  const [levels, setLevels] = useState(1)
  const [rows, setRows] = useState(1)
  const [columns, setColumns] = useState(1)

  const handleCreateBuilding = () => {
    if (!name.trim() || !buildingNumber.trim()) return

    addBuilding({
      id: crypto.randomUUID(),
      name: name.trim(),
      buildingNumber: buildingNumber.trim(),
      levels,
      rows,
      columns,
    })
  }
  return (
    <Dialog>
      <DialogTrigger render={trigger} />

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Building</DialogTitle>
          <DialogDescription>
            Set up the basic structure of your building.
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

          <div className="grid grid-cols-3 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="levels">Levels</Label>
              <Input
                id="levels"
                type="number"
                min={1}
                value={levels}
                onChange={(e) => setLevels(Number(e.target.value))}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="rows">Rows</Label>
              <Input
                id="rows"
                type="number"
                min={1}
                value={rows}
                onChange={(e) => setRows(Number(e.target.value))}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="columns">Columns</Label>
              <Input
                id="columns"
                type="number"
                min={1}
                value={columns}
                onChange={(e) => setColumns(Number(e.target.value))}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <DialogClose render={<Button variant="outline">Cancel</Button>} />

          <DialogClose
            render={
              <Button onClick={handleCreateBuilding}>
                Create Building
              </Button>
            }
          />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
