export type Item = {
  id: string;
  name: string;
  description?: string;
  category?: string;
  // Items don't belong to a single bin anymore - that's tracked in BinItem
};
