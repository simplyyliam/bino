import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  Input,
  Label,
  Textarea,
} from "@bino/ui";
import { useItemStore } from "@bino/store";

interface CreateICNDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  binId?: string;
  onCreated?: (icnId: string, itemId: string) => void;
}

export const CreateICNDialog = ({ open, onOpenChange, binId, onCreated }: CreateICNDialogProps) => {
  const createItem = useItemStore((s) => s.createItem);
  const createICN = useItemStore((s) => s.createICN);
  const addItemToBin = useItemStore((s) => s.addItemToBin);

  const [itemName, setItemName] = useState("");
  const [itemDescription, setItemDescription] = useState("");
  const [itemCategory, setItemCategory] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [partNumber, setPartNumber] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [quantity, setQuantity] = useState(1);

  const handleCreate = async () => {
    if (!itemName.trim()) return;

    try {
      // Create the item
      const itemId = await createItem({
        name: itemName,
        description: itemDescription || undefined,
        category: itemCategory || undefined,
      });

      // Create the ICN
      const icnId = await createICN({
        itemId,
        metadata: {
          manufacturer: manufacturer || undefined,
          partNumber: partNumber || undefined,
          serialNumber: serialNumber || undefined,
        },
      });

      // If a bin is specified, add the item to it
      if (binId) {
        await addItemToBin(binId, itemId, quantity, icnId);
      }

      // Call the callback
      onCreated?.(icnId, itemId);

      // Reset form
      setItemName("");
      setItemDescription("");
      setItemCategory("");
      setManufacturer("");
      setPartNumber("");
      setSerialNumber("");
      setQuantity(1);

      onOpenChange(false);
    } catch (error) {
      console.error("Failed to create ICN:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create New ICN</DialogTitle>
          <DialogDescription>
            Add a new item control number to track a physical item in your inventory.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-4">
          {/* Item Name */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="item-name">Item Name *</Label>
            <Input
              id="item-name"
              placeholder="e.g. Arduino Uno R3"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
            />
            <span className="text-[11px] text-muted-foreground">
              The name of the physical item this ICN identifies
            </span>
          </div>

          {/* Item Description */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="item-description">Description</Label>
            <Textarea
              id="item-description"
              placeholder="e.g. ATmega328P microcontroller board"
              value={itemDescription}
              onChange={(e) => setItemDescription(e.target.value)}
              rows={2}
            />
          </div>

          {/* Item Category */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="item-category">Category</Label>
            <Input
              id="item-category"
              placeholder="e.g. Development Boards"
              value={itemCategory}
              onChange={(e) => setItemCategory(e.target.value)}
            />
          </div>

          {/* Metadata Section */}
          <div className="border-t border-border pt-4 mt-2">
            <h4 className="text-sm font-semibold mb-3">Metadata (Optional)</h4>

            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="manufacturer">Manufacturer</Label>
                  <Input
                    id="manufacturer"
                    placeholder="e.g. Arduino"
                    value={manufacturer}
                    onChange={(e) => setManufacturer(e.target.value)}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="part-number">Part Number</Label>
                  <Input
                    id="part-number"
                    placeholder="e.g. A000066"
                    value={partNumber}
                    onChange={(e) => setPartNumber(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="serial-number">Serial Number</Label>
                <Input
                  id="serial-number"
                  placeholder="e.g. SN-ARD-12345"
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Quantity */}
          {binId && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="quantity">Initial Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
              />
              <span className="text-[11px] text-muted-foreground">
                How many of this item to add to the bin
              </span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCreate} disabled={!itemName.trim()}>
            Create ICN
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
