import { create } from "zustand";
import type { Item, ICN, BinItem, MovementHistoryEvent } from "@bino/types";
import { api } from "../api";
import { useMovementHistoryStore } from "./useMovementHistoryStore";

type AddItemOptions = {
  quantity?: number;
  icnId?: string;
  notes?: string;
  minQuantity?: number | null;
};

interface ItemStore {
  items: Item[];
  icns: ICN[];
  binItems: BinItem[];
  isLoading: boolean;

  // Fetch operations
  fetchItems: () => Promise<void>;
  fetchICNs: (itemId?: string) => Promise<void>;
  fetchBinItems: (binId?: string) => Promise<void>;

  // Item operations
  createItem: (item: { name: string; description?: string; category?: string }) => Promise<string>;
  updateItem: (id: string, updates: Partial<Omit<Item, "id">>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;

  // ICN operations
  // Leave `value` out to get the next ICN-000123. Pass `binItemId` to attach it to a row already in a bin.
  createICN: (icn: { itemId: string; value?: string; binItemId?: string; metadata?: Record<string, any> }) => Promise<string>;

  // BinItem operations
  addItemToBin: (binId: string, itemId: string, options?: AddItemOptions) => Promise<{ binItem: BinItem; merged: boolean }>;
  removeItemFromBin: (binItemId: string) => Promise<BinItem | undefined>;
  restoreBinItem: (binItem: BinItem) => Promise<void>;
  updateBinItemQuantity: (binItemId: string, quantity: number) => Promise<void>;
  updateBinItem: (binItemId: string, updates: { notes?: string | null; minQuantity?: number | null }) => Promise<void>;
  moveBinItem: (binItemId: string, toBinId: string) => Promise<void>;
  markBinOutOfStock: (binId: string) => Promise<void>;
  removeBinItemsForBins: (binIds: Set<string>) => void;
}

const pushEvent = (event?: MovementHistoryEvent | null) =>
  useMovementHistoryStore.getState().pushEvent(event);

export const useItemStore = create<ItemStore>()((set, get) => ({
  items: [],
  icns: [],
  binItems: [],
  isLoading: false,

  fetchItems: async () => {
    set({ isLoading: true });
    try {
      const items = await api.get<Item[]>("/api/items");
      set({ items, isLoading: false });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  fetchICNs: async (itemId) => {
    set({ isLoading: true });
    try {
      const path = itemId ? `/api/items/${itemId}/icns` : "/api/icns";
      const icns = await api.get<ICN[]>(path);
      set({ icns, isLoading: false });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  fetchBinItems: async (binId) => {
    set({ isLoading: true });
    try {
      const path = binId ? `/api/bins/${binId}/items` : "/api/bin-items";
      const binItems = await api.get<BinItem[]>(path);
      set({ binItems, isLoading: false });
    } catch (err) {
      set({ isLoading: false });
      throw err;
    }
  },

  createItem: async ({ name, description, category }) => {
    const item = await api.post<Item>("/api/items", { name, description, category });
    set((state) => ({ items: [...state.items, item] }));
    return item.id;
  },

  updateItem: async (id, updates) => {
    const previous = get().items;
    set((state) => ({
      items: state.items.map((i) => (i.id === id ? { ...i, ...updates } : i)),
    }));
    try {
      const item = await api.patch<Item>(`/api/items/${id}`, updates);
      set((state) => ({ items: state.items.map((i) => (i.id === id ? item : i)) }));
    } catch (err) {
      set({ items: previous });
      throw err;
    }
  },

  deleteItem: async (id) => {
    await api.delete(`/api/items/${id}`);
    // The API cascades ICNs and bin items for this item; mirror that locally.
    set((state) => ({
      items: state.items.filter((item) => item.id !== id),
      icns: state.icns.filter((icn) => icn.itemId !== id),
      binItems: state.binItems.filter((bi) => bi.itemId !== id),
    }));
  },

  createICN: async ({ itemId, value, binItemId, metadata }) => {
    const { icn, binItem, historyEvent } = await api.post<{
      icn: ICN;
      binItem?: BinItem | null;
      historyEvent?: MovementHistoryEvent;
    }>(`/api/items/${itemId}/icns`, { value, binItemId, metadata });
    set((state) => ({
      icns: [...state.icns, icn],
      binItems: binItem ? state.binItems.map((bi) => (bi.id === binItem.id ? binItem : bi)) : state.binItems,
    }));
    pushEvent(historyEvent);
    return icn.id;
  },

  addItemToBin: async (binId, itemId, options = {}) => {
    const { binItem, historyEvent, merged } = await api.post<{
      binItem: BinItem;
      historyEvent?: MovementHistoryEvent;
      merged: boolean;
    }>(`/api/bins/${binId}/items`, {
      itemId,
      icnId: options.icnId,
      quantity: options.quantity ?? 1,
      notes: options.notes,
      minQuantity: options.minQuantity,
    });

    // The API tops up an existing row when the item is already in the bin.
    set((state) => ({
      binItems: merged
        ? state.binItems.map((bi) => (bi.id === binItem.id ? binItem : bi))
        : [...state.binItems, binItem],
    }));
    pushEvent(historyEvent);
    return { binItem, merged };
  },

  removeItemFromBin: async (binItemId) => {
    const removed = get().binItems.find((bi) => bi.id === binItemId);
    // Optimistic: drop it from the list immediately, restore on failure.
    set((state) => ({ binItems: state.binItems.filter((bi) => bi.id !== binItemId) }));
    try {
      const { historyEvent } = await api.delete<{ historyEvent?: MovementHistoryEvent }>(
        `/api/bin-items/${binItemId}`
      );
      pushEvent(historyEvent);
      return removed;
    } catch (err) {
      if (removed) set((state) => ({ binItems: [...state.binItems, removed] }));
      throw err;
    }
  },

  restoreBinItem: async (binItem) => {
    // Undo for a removal: re-add the same item with the same details.
    await get().addItemToBin(binItem.binId, binItem.itemId, {
      quantity: binItem.quantity,
      icnId: binItem.icnId ?? undefined,
      notes: binItem.notes ?? undefined,
      minQuantity: binItem.minQuantity ?? null,
    });
  },

  updateBinItemQuantity: async (binItemId, quantity) => {
    const clamped = Math.max(0, Math.floor(quantity));
    const previous = get().binItems.find((bi) => bi.id === binItemId);
    if (!previous || previous.quantity === clamped) return;

    set((state) => ({
      binItems: state.binItems.map((bi) =>
        bi.id === binItemId ? { ...bi, quantity: clamped, lastModified: new Date().toISOString() } : bi
      ),
    }));
    try {
      const { binItem, historyEvent } = await api.patch<{
        binItem: BinItem;
        historyEvent?: MovementHistoryEvent;
      }>(`/api/bin-items/${binItemId}`, { quantity: clamped });
      set((state) => ({
        binItems: state.binItems.map((bi) => (bi.id === binItemId ? binItem : bi)),
      }));
      pushEvent(historyEvent);
    } catch (err) {
      set((state) => ({
        binItems: state.binItems.map((bi) => (bi.id === binItemId ? previous : bi)),
      }));
      throw err;
    }
  },

  updateBinItem: async (binItemId, updates) => {
    const previous = get().binItems.find((bi) => bi.id === binItemId);
    if (!previous) return;
    set((state) => ({
      binItems: state.binItems.map((bi) => (bi.id === binItemId ? { ...bi, ...updates } as BinItem : bi)),
    }));
    try {
      const { binItem } = await api.patch<{ binItem: BinItem }>(`/api/bin-items/${binItemId}`, updates);
      set((state) => ({
        binItems: state.binItems.map((bi) => (bi.id === binItemId ? binItem : bi)),
      }));
    } catch (err) {
      set((state) => ({
        binItems: state.binItems.map((bi) => (bi.id === binItemId ? previous : bi)),
      }));
      throw err;
    }
  },

  moveBinItem: async (binItemId, toBinId) => {
    const { binItem, removedBinItemId, historyEvent } = await api.post<{
      binItem: BinItem;
      removedBinItemId: string | null;
      historyEvent?: MovementHistoryEvent;
    }>(`/api/bin-items/${binItemId}/move`, { toBinId });

    set((state) => {
      const rest = state.binItems.filter(
        (bi) => bi.id !== binItem.id && bi.id !== removedBinItemId
      );
      return { binItems: [...rest, binItem] };
    });
    pushEvent(historyEvent);
  },

  markBinOutOfStock: async (binId) => {
    const { binItems, historyEvent } = await api.post<{
      binItems: BinItem[];
      historyEvent?: MovementHistoryEvent;
    }>(`/api/bins/${binId}/out-of-stock`);

    const updated = new Map(binItems.map((bi) => [bi.id, bi]));
    set((state) => ({
      binItems: state.binItems.map((bi) => updated.get(bi.id) ?? bi),
    }));
    pushEvent(historyEvent);
  },

  removeBinItemsForBins: (binIds) => {
    if (binIds.size === 0) return;
    set((state) => ({ binItems: state.binItems.filter((bi) => !binIds.has(bi.binId)) }));
  },
}));
