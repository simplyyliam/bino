import { useState, useEffect, useRef } from "react";
import { useBinStore, useItemStore } from "@bino/store";
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
import { Pill } from "@/shared/components";
import { IconPicker } from "./IconPicker";
import { ItemPicker } from "./ItemPicker";
import { CreateICNDialog } from "./CreateICNDialog";

interface BinDetailSheetProps {
  bin: Bin | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BinDetailSheet({ bin, open, onOpenChange }: BinDetailSheetProps) {
  const updateBin = useBinStore((s) => s.updateBin);
  const setBinQuantity = useBinStore((s) => s.setBinQuantity);
  const setBinOutOfService = useBinStore((s) => s.setBinOutOfService);

  // Subscribe to the raw binItems array for reactive updates
  const allBinItems = useItemStore((s) => s.binItems);
  const items = useItemStore((s) => s.items);
  const icns = useItemStore((s) => s.icns);
  const addItemToBin = useItemStore((s) => s.addItemToBin);
  const removeItemFromBin = useItemStore((s) => s.removeItemFromBin);
  const updateBinItemQuantity = useItemStore((s) => s.updateBinItemQuantity);
  const markBinOutOfStock = useItemStore((s) => s.markBinOutOfStock);

  const [name, setName] = useState(bin?.name || "");
  const [showCreateICN, setShowCreateICN] = useState(false);
  const [showItemPicker, setShowItemPicker] = useState(false);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Flush any pending name update if the sheet closes or a different bin is selected
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [bin?.id]);

  // Derive binItems for this bin from the subscribed arrays
  const binItems = bin
    ? allBinItems
        .filter((bi) => bi.binId === bin.id)
        .map((binItem) => {
          const item = items.find((i) => i.id === binItem.itemId);
          const icn = binItem.icnId ? icns.find((i) => i.id === binItem.icnId) : undefined;
          return { item: item!, icn, binItem };
        })
        .filter(({ item }) => item !== undefined)
    : [];

  // Keep local name state in sync when selected bin changes
  useEffect(() => {
    if (bin) {
      setName(bin.name || "");
    }
  }, [bin]);

  if (!bin) return null;

  // const storage = storages.find((s) => s.id === bin.storageId);
  // const locationSystem = locationSystems.find((ls) => ls.id === storage?.locationSystemId);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setName(newName);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      updateBin(bin.id, { name: newName }).catch((error) => {
        console.error("Failed to update bin name:", error);
      });
    }, 400);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col justify-between">
        <div className="flex flex-col gap-6">
          <SheetHeader className="gap-2.5">
            <div className="flex items-center gap-2.5">
              <IconPicker binId={bin.id} />
              <div className="flex flex-col gap-2">
                <SheetTitle className="text-xl pt-1">
                  {bin.name || bin.locationCode}
                </SheetTitle>
                <SheetDescription>
                  View and manage bin details, assigned items, and location mappings.
                </SheetDescription>
              </div>
            </div>
            <Pill status value={bin.locationCode} label="Location" className="w-fit" />
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


          {/* Parts / ICN Catalog Section */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Part References & ICNs
              </h4>
              <Badge variant="outline" className="text-[10px]">
                {binItems.length} {binItems.length === 1 ? "Item" : "Items"}
              </Badge>
            </div>

            {binItems.length > 0 ? (
              <div className="flex flex-col gap-2">
                {binItems.map(({ item, icn, binItem }) => (
                  <div
                    key={binItem.id}
                    className="flex flex-col gap-2 p-3 border border-border rounded-lg bg-card/60"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-medium">{item.name}</span>
                        {item.description && (
                          <span className="text-xs text-muted-foreground">{item.description}</span>
                        )}
                        {icn && (
                          <span className="text-[11px] font-mono text-muted-foreground">
                            ICN: {icn.value}
                          </span>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs h-7"
                        onClick={() => removeItemFromBin(binItem.id)}
                      >
                        Remove
                      </Button>
                    </div>

                    <div className="flex items-center gap-2">
                      <Label htmlFor={`quantity-${binItem.id}`} className="text-xs">
                        Qty:
                      </Label>
                      <Input
                        id={`quantity-${binItem.id}`}
                        type="number"
                        min={0}
                        value={binItem.quantity}
                        onChange={(e) => {
                          const value = Number(e.target.value);
                          updateBinItemQuantity(binItem.id, value);
                        }}
                        className="h-8 w-24"
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-6 border border-dashed border-border rounded-lg text-center gap-2 bg-muted/20">
                <p className="text-xs font-medium text-foreground">No parts assigned yet</p>
                <p className="text-[11px] text-muted-foreground max-w-xs">
                  Part number indexing and inventory tagging will connect directly to this bin location.
                </p>
              </div>
            )}

            {bin && (
              <div className="flex gap-2">
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setShowCreateICN(true)}
                  className="flex-1"
                >
                  + Create New ICN
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowItemPicker(true)}
                  className="flex-1"
                >
                  + Assign Existing Item
                </Button>
              </div>
            )}

            {bin && (
              <>
                <CreateICNDialog
                  open={showCreateICN}
                  onOpenChange={setShowCreateICN}
                  binId={bin.id}
                  onCreated={(icnId, itemId) => {
                    console.log("ICN created:", icnId, itemId);
                  }}
                />
                {showItemPicker && (
                  <ItemPicker
                    onSelect={(itemId) => {
                      addItemToBin(bin.id, itemId, 1);
                      setShowItemPicker(false);
                    }}
                  />
                )}
              </>
            )}
          </div>
        </div>

        <SheetFooter className="flex-col! gap-2 sm:flex-row">
          <Button
            variant="destructive"
            className="w-full"
            onClick={() => {
              markBinOutOfStock(bin.id);
              setBinQuantity(bin.id, 0);
            }}
            disabled={binItems.length === 0}
          >
            Mark Out of Stock
          </Button>

          <Button
            variant={bin.isOutOfService ? "default" : "destructive"}
            className="w-full"
            onClick={() => setBinOutOfService(bin.id, !bin.isOutOfService)}
          >
            {bin.isOutOfService ? "Mark Serviceable" : "Mark Out of Service"}
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
