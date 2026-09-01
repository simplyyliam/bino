import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Item, ICN, BinItem } from "@bino/types";
import { Items, ICNS, BinItems } from "@bino/data";
import { useMovementHistoryStore } from "./useMovementHistoryStore";

interface ItemStore {
  items: Item[];
  icns: ICN[];
  binItems: BinItem[];

  // Item operations
  getItem: (itemId: string) => Item | undefined;
  searchItems: (query: string) => Item[];
  createItem: (item: { name: string; description?: string; category?: string }) => string;

  // ICN operations
  getICN: (icnId: string) => ICN | undefined;
  getICNByValue: (value: string) => ICN | undefined;
  getICNsByItem: (itemId: string) => ICN[];
  createICN: (icn: { itemId: string; metadata?: Record<string, any> }) => string;

  // BinItem operations
  getBinItems: (binId: string) => BinItem[];
  getItemsByBin: (binId: string) => { item: Item; icn?: ICN; binItem: BinItem }[];
  addItemToBin: (binId: string, itemId: string, quantity: number, icnId?: string, notes?: string) => void;
  removeItemFromBin: (binItemId: string) => void;
  updateBinItemQuantity: (binItemId: string, quantity: number) => void;
  markBinOutOfStock: (binId: string) => void;

  // Search across bins for an item or ICN
  findItemLocations: (itemId: string) => { binId: string; quantity: number; binItem: BinItem }[];
  findICNLocation: (icnValue: string) => { binId: string; quantity: number; binItem: BinItem } | undefined;
}

export const useItemStore = create<ItemStore>()(
  persist(
    (set, get) => ({
  items: Items,
  icns: ICNS,
  binItems: BinItems,

  getItem: (itemId) => {
    return get().items.find((item) => item.id === itemId);
  },

  searchItems: (query) => {
    const lowerQuery = query.toLowerCase();
    return get().items.filter(
      (item) =>
        item.name.toLowerCase().includes(lowerQuery) ||
        item.description?.toLowerCase().includes(lowerQuery) ||
        item.category?.toLowerCase().includes(lowerQuery)
    );
  },

  createItem: ({ name, description, category }) => {
    const newItem: Item = {
      id: `item-${Date.now()}`,
      name,
      description,
      category,
    };

    set((state) => ({
      items: [...state.items, newItem],
    }));

    return newItem.id;
  },

  getICN: (icnId) => {
    return get().icns.find((icn) => icn.id === icnId);
  },

  getICNByValue: (value) => {
    return get().icns.find((icn) => icn.value === value);
  },

  getICNsByItem: (itemId) => {
    return get().icns.filter((icn) => icn.itemId === itemId);
  },

  createICN: ({ itemId, metadata }) => {
    const existingICNs = get().icns;
    // Generate next ICN value
    const maxICNNumber = existingICNs.reduce((max, icn) => {
      const match = icn.value.match(/ICN-(\d+)/);
      if (match) {
        return Math.max(max, parseInt(match[1], 10));
      }
      return max;
    }, 0);

    const newICNValue = `ICN-${String(maxICNNumber + 1).padStart(6, "0")}`;

    const newICN: ICN = {
      id: `icn-${Date.now()}`,
      value: newICNValue,
      itemId,
      createdAt: new Date().toISOString(),
      metadata,
    };

    set((state) => ({
      icns: [...state.icns, newICN],
    }));

    // Record history
    const item = get().items.find((i) => i.id === itemId);
    useMovementHistoryStore.getState().addHistoryEvent({
      eventType: "icn_created",
      icnId: newICN.id,
      itemId,
      summary: `ICN ${newICNValue} created for "${item?.name || "Unknown Item"}"`,
    });

    return newICN.id;
  },

  getBinItems: (binId) => {
    return get().binItems.filter((bi) => bi.binId === binId);
  },

  getItemsByBin: (binId) => {
    const binItems = get().getBinItems(binId);
    return binItems.map((binItem) => {
      const item = get().getItem(binItem.itemId);
      const icn = binItem.icnId ? get().getICN(binItem.icnId) : undefined;
      return {
        item: item!,
        icn,
        binItem,
      };
    }).filter(({ item }) => item !== undefined);
  },

  addItemToBin: (binId, itemId, quantity, icnId, notes) => {
    const now = new Date().toISOString();
    const newBinItem: BinItem = {
      id: `binitem-${Date.now()}`,
      binId,
      itemId,
      icnId,
      quantity,
      addedAt: now,
      lastModified: now,
      notes,
    };

    set((state) => ({
      binItems: [...state.binItems, newBinItem],
    }));

    // Record history
    const item = get().items.find((i) => i.id === itemId);
    const icn = icnId ? get().icns.find((i) => i.id === icnId) : undefined;
    useMovementHistoryStore.getState().addHistoryEvent({
      eventType: "item_added_to_bin",
      binId,
      itemId,
      icnId,
      binItemId: newBinItem.id,
      quantityAfter: quantity,
      summary: `"${item?.name || "Unknown Item"}"${icn ? ` (${icn.value})` : ""} added to bin with quantity ${quantity}`,
    });
  },

  removeItemFromBin: (binItemId) => {
    const binItem = get().binItems.find((bi) => bi.id === binItemId);

    if (binItem) {
      const item = get().items.find((i) => i.id === binItem.itemId);
      const icn = binItem.icnId ? get().icns.find((i) => i.id === binItem.icnId) : undefined;

      // Record history before removal
      useMovementHistoryStore.getState().addHistoryEvent({
        eventType: "item_removed_from_bin",
        binId: binItem.binId,
        itemId: binItem.itemId,
        icnId: binItem.icnId,
        binItemId,
        quantityBefore: binItem.quantity,
        summary: `"${item?.name || "Unknown Item"}"${icn ? ` (${icn.value})` : ""} removed from bin`,
      });
    }

    set((state) => ({
      binItems: state.binItems.filter((bi) => bi.id !== binItemId),
    }));
  },

  updateBinItemQuantity: (binItemId, quantity) => {
    const binItem = get().binItems.find((bi) => bi.id === binItemId);
    const oldQuantity = binItem?.quantity ?? 0;

    set((state) => ({
      binItems: state.binItems.map((bi) =>
        bi.id === binItemId
          ? { ...bi, quantity, lastModified: new Date().toISOString() }
          : bi
      ),
    }));

    // Record history
    if (binItem) {
      const item = get().items.find((i) => i.id === binItem.itemId);
      const icn = binItem.icnId ? get().icns.find((i) => i.id === binItem.icnId) : undefined;
      const eventType = quantity > oldQuantity ? "quantity_increased" : "quantity_decreased";

      useMovementHistoryStore.getState().addHistoryEvent({
        eventType,
        binId: binItem.binId,
        itemId: binItem.itemId,
        icnId: binItem.icnId,
        binItemId,
        quantityBefore: oldQuantity,
        quantityAfter: quantity,
        summary: `"${item?.name || "Unknown Item"}"${icn ? ` (${icn.value})` : ""} quantity changed: ${oldQuantity} → ${quantity}`,
      });
    }
  },

  markBinOutOfStock: (binId) => {
    const binItemsForBin = get().binItems.filter((bi) => bi.binId === binId);

    set((state) => ({
      binItems: state.binItems.map((bi) =>
        bi.binId === binId
          ? { ...bi, quantity: 0, lastModified: new Date().toISOString() }
          : bi
      ),
    }));

    // Record history
    useMovementHistoryStore.getState().addHistoryEvent({
      eventType: "marked_out_of_stock",
      binId,
      summary: `Bin marked out of stock (${binItemsForBin.length} ${binItemsForBin.length === 1 ? 'item' : 'items'} set to quantity 0)`,
    });
  },

  findItemLocations: (itemId) => {
    return get().binItems
      .filter((bi) => bi.itemId === itemId)
      .map((binItem) => ({
        binId: binItem.binId,
        quantity: binItem.quantity,
        binItem,
      }));
  },

  findICNLocation: (icnValue) => {
    const icn = get().getICNByValue(icnValue);
    if (!icn) return undefined;

    const binItem = get().binItems.find((bi) => bi.icnId === icn.id);
    if (!binItem) return undefined;

    return {
      binId: binItem.binId,
      quantity: binItem.quantity,
      binItem,
    };
  },
    }),
    {
      name: "bino-items-storage"
    }
  )
);
