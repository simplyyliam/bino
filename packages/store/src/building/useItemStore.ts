import { create } from "zustand";
import type { Item, ICN, BinItem } from "@bino/types";
import { Items, ICNS, BinItems } from "@bino/data";

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

export const useItemStore = create<ItemStore>((set, get) => ({
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
  },

  removeItemFromBin: (binItemId) => {
    set((state) => ({
      binItems: state.binItems.filter((bi) => bi.id !== binItemId),
    }));
  },

  updateBinItemQuantity: (binItemId, quantity) => {
    set((state) => ({
      binItems: state.binItems.map((bi) =>
        bi.id === binItemId
          ? { ...bi, quantity, lastModified: new Date().toISOString() }
          : bi
      ),
    }));
  },

  markBinOutOfStock: (binId) => {
    set((state) => ({
      binItems: state.binItems.map((bi) =>
        bi.binId === binId
          ? { ...bi, quantity: 0, lastModified: new Date().toISOString() }
          : bi
      ),
    }));
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
}));
