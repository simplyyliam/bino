import { create } from "zustand";
import type { Item, ICN, BinItem, MovementHistoryEvent } from "@bino/types";
import { api } from "../api";
import { useMovementHistoryStore } from "./useMovementHistoryStore";

interface ItemStore {
  items: Item[];
  icns: ICN[];
  binItems: BinItem[];
  isLoading: boolean;

  // Fetch operations
  fetchItems: (search?: string) => Promise<void>;
  fetchICNs: (itemId?: string) => Promise<void>;
  fetchBinItems: (binId?: string) => Promise<void>;

  // Item operations
  getItem: (itemId: string) => Item | undefined;
  searchItems: (query: string) => Item[];
  createItem: (item: { name: string; description?: string; category?: string }) => Promise<string>;
  updateItem: (id: string, updates: Partial<Omit<Item, "id">>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;

  // ICN operations
  getICN: (icnId: string) => ICN | undefined;
  getICNByValue: (value: string) => ICN | undefined;
  getICNsByItem: (itemId: string) => ICN[];
  createICN: (icn: { itemId: string; metadata?: Record<string, any> }) => Promise<string>;

  // BinItem operations
  getBinItems: (binId: string) => BinItem[];
  getItemsByBin: (binId: string) => { item: Item; icn?: ICN; binItem: BinItem }[];
  addItemToBin: (binId: string, itemId: string, quantity: number, icnId?: string, notes?: string) => Promise<void>;
  removeItemFromBin: (binItemId: string) => Promise<void>;
  updateBinItemQuantity: (binItemId: string, quantity: number) => Promise<void>;
  markBinOutOfStock: (binId: string) => Promise<void>;

  // Search across bins for an item or ICN
  findItemLocations: (itemId: string) => { binId: string; quantity: number; binItem: BinItem }[];
  findICNLocation: (icnValue: string) => { binId: string; quantity: number; binItem: BinItem } | undefined;
}

export const useItemStore = create<ItemStore>()((set, get) => ({
  items: [],
  icns: [],
  binItems: [],
  isLoading: false,

  fetchItems: async (search) => {
    set({ isLoading: true });
    try {
      const path = search ? `/api/items?search=${encodeURIComponent(search)}` : "/api/items";
      const items = await api.get<Item[]>(path);
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

  createItem: async ({ name, description, category }) => {
    const item = await api.post<Item>("/api/items", { name, description, category });
    set((state) => ({ items: [...state.items, item] }));
    return item.id;
  },

  updateItem: async (id, updates) => {
    const item = await api.patch<Item>(`/api/items/${id}`, updates);
    set((state) => ({
      items: state.items.map((i) => (i.id === id ? item : i))
    }));
  },

  deleteItem: async (id) => {
    await api.delete(`/api/items/${id}`);
    set((state) => ({
      items: state.items.filter((item) => item.id !== id)
    }));
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

  createICN: async ({ itemId, metadata }) => {
    // The API historically returned a bare ICN; newer versions return
    // `{ icn, historyEvent }`. Accept both so the client works against either.
    const response = await api.post<ICN | { icn: ICN; historyEvent?: MovementHistoryEvent }>(
      `/api/items/${itemId}/icns`,
      { metadata }
    );

    const icn = "icn" in response ? response.icn : response;
    const historyEvent = "icn" in response ? response.historyEvent : undefined;

    if (!icn?.id) {
      throw new Error("createICN: API did not return an ICN");
    }

    set((state) => ({ icns: [...state.icns, icn] }));

    if (historyEvent) {
      useMovementHistoryStore.setState((state) => ({
        history: [historyEvent, ...state.history],
      }));
    } else {
      // Older API creates the history row server-side without returning it,
      // so pull it in rather than leaving the timeline stale until a refresh.
      void useMovementHistoryStore.getState().fetchHistory();
    }

    return icn.id;
  },

  getBinItems: (binId) => {
    return get().binItems.filter((bi) => bi.binId === binId);
  },

  getItemsByBin: (binId) => {
    const binItems = get().getBinItems(binId);
    return binItems
      .map((binItem) => {
        const item = get().getItem(binItem.itemId);
        const icn = binItem.icnId ? get().getICN(binItem.icnId) : undefined;
        return {
          item: item!,
          icn,
          binItem,
        };
      })
      .filter(({ item }) => item !== undefined);
  },

  addItemToBin: async (binId, itemId, quantity, icnId, notes) => {
    // Accept both the legacy bare BinItem response and `{ binItem, historyEvent }`.
    const response = await api.post<
      BinItem | { binItem: BinItem; historyEvent?: MovementHistoryEvent }
    >(`/api/bins/${binId}/items`, {
      itemId,
      icnId,
      quantity,
      notes
    });

    const binItem = "binItem" in response ? response.binItem : response;
    const historyEvent = "binItem" in response ? response.historyEvent : undefined;

    if (!binItem?.id) {
      throw new Error("addItemToBin: API did not return a bin item");
    }

    set((state) => ({ binItems: [...state.binItems, binItem] }));

    if (historyEvent) {
      useMovementHistoryStore.setState((state) => ({
        history: [historyEvent, ...state.history],
      }));
    } else {
      void useMovementHistoryStore.getState().fetchHistory();
    }
  },

  removeItemFromBin: async (binItemId) => {
    await api.delete(`/api/bin-items/${binItemId}`);

    // Remove locally first so the UI updates without waiting on a refetch.
    set((state) => ({
      binItems: state.binItems.filter((bi) => bi.id !== binItemId),
    }));

    // The API already records the `item_removed_from_bin` event, so pull it in
    // rather than POSTing a second, duplicate event from the client.
    void useMovementHistoryStore.getState().fetchHistory();
  },

  updateBinItemQuantity: async (binItemId, quantity) => {
    await api.patch(`/api/bin-items/${binItemId}`, { quantity });

    set((state) => ({
      binItems: state.binItems.map((bi) =>
        bi.id === binItemId
          ? { ...bi, quantity, lastModified: new Date().toISOString() }
          : bi
      ),
    }));

    // The API already records the quantity_increased/decreased event, so pull it
    // in rather than POSTing a second, duplicate event from the client.
    void useMovementHistoryStore.getState().fetchHistory();
  },

  markBinOutOfStock: async (binId) => {
    const binItemsForBin = get().binItems.filter((bi) => bi.binId === binId);

    await Promise.all(
      binItemsForBin.map((bi) => api.patch(`/api/bin-items/${bi.id}`, { quantity: 0 }))
    );

    set((state) => ({
      binItems: state.binItems.map((bi) =>
        bi.binId === binId
          ? { ...bi, quantity: 0, lastModified: new Date().toISOString() }
          : bi
      ),
    }));

    // Record history
    await useMovementHistoryStore.getState().addHistoryEvent({
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
}));
