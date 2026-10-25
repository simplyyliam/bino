-- Optional low-stock threshold per bin item
ALTER TABLE "BinItem" ADD COLUMN "minQuantity" INTEGER;
