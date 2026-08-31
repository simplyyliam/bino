import { useState, useEffect } from "react";
import { useBinStore, useLocationSystemStore, useStorageStore } from "@bino/store";
import type { Bin } from "@bino/types";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  Button,
  Input,
  Label,
  Badge,
} from "@bino/ui";

interface BinDetailSheetProps {
  bin: Bin | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BinDetailSheet({ bin, open, onOpenChange }: BinDetailSheetProps) {
  const updateBin = useBinStore((s) => s.updateBin);
  const stockBin = useBinStore((s) => s.stockBin);
  const unstockBin = useBinStore((s) => s.unstockBin);
  const setBinQuantity = useBinStore((s) => s.setBinQuantity);
  const setBinOutOfService = useBinStore((s) => s.setBinOutOfService);
  const storages = useStorageStore((s) => s.storages);
  const locationSystems = useLocationSystemStore((s) => s.locationSystems);

  const [name, setName] = useState(bin?.name || "");
  // local quantity
  const [quantity, setQuantity] = useState(bin?.quantity ?? 0)
  
  // Keep local name state in sync when selected bin changes
  useEffect(() => {
    if (bin) {
      setName(bin.name || "");
      setQuantity(bin.quantity ?? 0)
    }
  }, [bin]);

  if (!bin) return null;

  const storage = storages.find((s) => s.id === bin.storageId);
  const locationSystem = locationSystems.find((ls) => ls.id === storage?.locationSystemId);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setName(newName);
    updateBin(bin.id, { name: newName });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col justify-between">
        <div className="flex flex-col gap-6">
          <SheetHeader>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono text-xs font-semibold px-2 py-0.5">
                {bin.locationCode}
              </Badge>
              <Badge variant="secondary" className="text-[11px]">
                Active Storage
              </Badge>
            </div>
            <SheetTitle className="text-xl pt-1">
              {bin.name || bin.locationCode}
            </SheetTitle>
            <SheetDescription>
              View and manage bin details, assigned items, and location mappings.
            </SheetDescription>
          </SheetHeader>

          {/* Bin Name Configuration */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="bin-name-input">Bin Label / Description</Label>
            <Input
              id="bin-name-input"
              placeholder="e.g. Resistors 10k, Hardware..."
              value={name}
              onChange={handleNameChange}
            />
            <span className="text-[11px] text-muted-foreground">
              Custom identifier shown during search and catalog operations.
            </span>
          </div>

          {/* Location Hierarchy & Coordinates */}
          <div className="flex flex-col gap-3 rounded-lg border border-border/70 p-4 bg-card/60">
            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">
              Location Mapping
            </h4>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="flex flex-col gap-1 p-2.5 rounded-md bg-muted/40">
                <span className="text-muted-foreground">System</span>
                <span className="font-medium text-foreground truncate">
                  {locationSystem?.name || "Standard"}
                </span>
              </div>
              <div className="flex flex-col gap-1 p-2.5 rounded-md bg-muted/40">
                <span className="text-muted-foreground">Location Code</span>
                <span className="font-mono font-semibold text-primary">
                  {bin.locationCode}
                </span>
              </div>
              <div className="flex flex-col gap-1 p-2.5 rounded-md bg-muted/40">
                <span className="text-muted-foreground">Grid Column</span>
                <span className="font-mono font-medium text-foreground">
                  Column {bin.column + 1}
                </span>
              </div>
              <div className="flex flex-col gap-1 p-2.5 rounded-md bg-muted/40">
                <span className="text-muted-foreground">Shelf / Row</span>
                <span className="font-mono font-medium text-foreground">
                  Row {bin.row + 1}
                </span>
              </div>
            </div>
          </div>

          {/* Parts / ICN Catalog Section */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Part References & ICNs
              </h4>
              <Badge variant="outline" className="text-[10px]">
                0 Items
              </Badge>
            </div>

            <div className="flex flex-col items-center justify-center p-6 border border-dashed border-border rounded-lg text-center gap-2 bg-muted/20">
              <p className="text-xs font-medium text-foreground">No parts assigned yet</p>
              <p className="text-[11px] text-muted-foreground max-w-xs">
                Part number indexing and inventory tagging will connect directly to this bin location.
              </p>
              <Button variant="outline" size="sm" className="mt-2 text-xs" disabled>
                + Assign Part / ICN
              </Button>
            </div>
          </div>
        </div>
        
        {/* Inventory */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">
              Inventory
            </h4>
        
            <Badge variant="outline" className="text-[10px]">
              {bin.itemId ? "Stocked" : "Empty"}
            </Badge>
          </div>
        
          {bin.itemId ? (
            <div className="flex flex-col gap-3 rounded-lg border border-border/70 p-4 bg-card/60">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground">Item</span>
                <span className="text-sm font-medium">
                  {bin.itemId}
                </span>
              </div>
        
              <div className="flex flex-col gap-2">
                <Label htmlFor="bin-quantity">Quantity</Label>
        
                <Input
                  id="bin-quantity"
                  type="number"
                  min={0}
                  value={quantity}
                  onChange={(e) => {
                    const value = Number(e.target.value);
                    setQuantity(value);
                    setBinQuantity(bin.id, value);
                  }}
                />
              </div>
        
              <Button
                variant="outline"
                size="sm"
                onClick={() => unstockBin(bin.id)}
              >
                Unstock Bin
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-3 rounded-lg border border-dashed border-border p-4">
              <p className="text-xs text-muted-foreground">
                This bin currently has no item assigned.
              </p>
        
              <Button
                size="sm"
                onClick={() => stockBin(bin.id, "example-item", 1)}
              >
                Stock Bin
              </Button>
            </div>
          )}
        </div>

        <SheetFooter className="flex-col! gap-2 sm:flex-row">
          <Button
            variant="destructive"
            className="w-full"
            onClick={() => setBinQuantity(bin.id, 0)}
            disabled={!bin.itemId || bin.quantity === 0}
          >
            Mark Out of Stock
          </Button>
        
          <Button
            variant="destructive"
            className="w-full"
            onClick={() => setBinOutOfService(bin.id, true)}
            disabled={bin.isOutOfService}
          >
            Mark Out of Service
          </Button>
        
          <Button
            variant="default"
            className="w-full"
            onClick={() => onOpenChange(false)}
          >
            Done
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
