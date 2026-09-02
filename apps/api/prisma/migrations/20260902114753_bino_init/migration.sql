-- CreateTable
CREATE TABLE "Building" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "buildingNumber" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Building_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Storage" (
    "id" TEXT NOT NULL,
    "buildingId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "locationSystemId" TEXT NOT NULL,
    "maxLevel" INTEGER NOT NULL,
    "maxRow" INTEGER NOT NULL,
    "maxColumn" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Storage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bin" (
    "id" TEXT NOT NULL,
    "storageId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "locationCode" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "row" INTEGER NOT NULL,
    "column" INTEGER NOT NULL,
    "position" INTEGER NOT NULL,
    "itemId" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "isOutOfService" BOOLEAN NOT NULL DEFAULT false,
    "icon" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Bin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Item" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ICN" (
    "id" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ICN_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BinItem" (
    "id" TEXT NOT NULL,
    "binId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "icnId" TEXT,
    "quantity" INTEGER NOT NULL,
    "notes" TEXT,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastModified" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BinItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LocationSystem" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "usesExistingCodes" BOOLEAN NOT NULL,
    "separator" TEXT NOT NULL,
    "paddingWidth" INTEGER NOT NULL,
    "levels" JSONB NOT NULL,
    "mappingRules" JSONB NOT NULL,
    "gridConfig" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LocationSystem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MovementHistory" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "eventType" TEXT NOT NULL,
    "binId" TEXT,
    "itemId" TEXT,
    "icnId" TEXT,
    "binItemId" TEXT,
    "fromBinId" TEXT,
    "toBinId" TEXT,
    "quantityBefore" INTEGER,
    "quantityAfter" INTEGER,
    "reason" TEXT,
    "user" TEXT,
    "summary" TEXT NOT NULL,

    CONSTRAINT "MovementHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ICN_value_key" ON "ICN"("value");

-- AddForeignKey
ALTER TABLE "Storage" ADD CONSTRAINT "Storage_buildingId_fkey" FOREIGN KEY ("buildingId") REFERENCES "Building"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Storage" ADD CONSTRAINT "Storage_locationSystemId_fkey" FOREIGN KEY ("locationSystemId") REFERENCES "LocationSystem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bin" ADD CONSTRAINT "Bin_storageId_fkey" FOREIGN KEY ("storageId") REFERENCES "Storage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ICN" ADD CONSTRAINT "ICN_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BinItem" ADD CONSTRAINT "BinItem_binId_fkey" FOREIGN KEY ("binId") REFERENCES "Bin"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BinItem" ADD CONSTRAINT "BinItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BinItem" ADD CONSTRAINT "BinItem_icnId_fkey" FOREIGN KEY ("icnId") REFERENCES "ICN"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovementHistory" ADD CONSTRAINT "MovementHistory_binId_fkey" FOREIGN KEY ("binId") REFERENCES "Bin"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovementHistory" ADD CONSTRAINT "MovementHistory_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovementHistory" ADD CONSTRAINT "MovementHistory_icnId_fkey" FOREIGN KEY ("icnId") REFERENCES "ICN"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovementHistory" ADD CONSTRAINT "MovementHistory_binItemId_fkey" FOREIGN KEY ("binItemId") REFERENCES "BinItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovementHistory" ADD CONSTRAINT "MovementHistory_fromBinId_fkey" FOREIGN KEY ("fromBinId") REFERENCES "Bin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MovementHistory" ADD CONSTRAINT "MovementHistory_toBinId_fkey" FOREIGN KEY ("toBinId") REFERENCES "Bin"("id") ON DELETE SET NULL ON UPDATE CASCADE;
