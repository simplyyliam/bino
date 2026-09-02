import { Router } from "express";
import { prisma } from "../db.js";
import {
  expandStorage,
  generateLocationCode,
  getNextBinLocation,
} from "@bino/data";
import { asyncHandler, notFound } from "../utils/errors.js";

const router = Router();

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { storageId } = req.query;
    const bins = await prisma.bin.findMany({
      where: storageId ? { storageId: String(storageId) } : undefined,
      orderBy: { createdAt: "asc" },
    });
    res.json(bins);
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const bin = await prisma.bin.findUnique({ where: { id: req.params.id } });
    if (!bin) throw notFound("Bin");
    res.json(bin);
  })
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const { storageId, name } = req.body;

    const storage = await prisma.storage.findUnique({ where: { id: storageId } });
    if (!storage) throw notFound("Storage");

    const locationSystem = await prisma.locationSystem.findUnique({
      where: { id: storage.locationSystemId },
    });
    if (!locationSystem) throw notFound("LocationSystem");

    const existingBins = await prisma.bin.findMany({ where: { storageId } });

    const nextLocation = getNextBinLocation(
      storage as any,
      existingBins as any,
      locationSystem as any
    );
    const locationCode = generateLocationCode(nextLocation, locationSystem as any);

    const bin = await prisma.bin.create({
      data: {
        storageId,
        name: name || `Bin ${existingBins.length + 1}`,
        locationCode,
        level: nextLocation.level,
        row: nextLocation.row,
        column: nextLocation.column,
        position: nextLocation.position,
        quantity: 0,
        isOutOfService: false,
      },
    });

    const updatedStorage = expandStorage(storage as any, nextLocation);
    await prisma.storage.update({
      where: { id: storageId },
      data: {
        maxLevel: updatedStorage.maxLevel,
        maxRow: updatedStorage.maxRow,
        maxColumn: updatedStorage.maxColumn,
      },
    });

    res.status(201).json(bin);
  })
);

router.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const {
      name,
      locationCode,
      itemId,
      quantity,
      isOutOfService,
      icon,
      level,
      row,
      column,
      position,
    } = req.body;

    const bin = await prisma.bin.update({
      where: { id: req.params.id },
      data: {
        name,
        locationCode,
        itemId,
        quantity,
        isOutOfService,
        icon,
        level,
        row,
        column,
        position,
      },
    });
    res.json(bin);
  })
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await prisma.bin.delete({ where: { id: req.params.id } });
    res.status(204).send();
  })
);

// --- BinItem sub-routes ---

router.get(
  "/:binId/items",
  asyncHandler(async (req, res) => {
    const binItems = await prisma.binItem.findMany({
      where: { binId: req.params.binId },
    });
    res.json(binItems);
  })
);

router.post(
  "/:binId/items",
  asyncHandler(async (req, res) => {
    const { binId } = req.params;
    const { itemId, icnId, quantity, notes } = req.body;

    const binItem = await prisma.binItem.create({
      data: { binId, itemId, icnId, quantity, notes },
    });

    const item = await prisma.item.findUnique({ where: { id: itemId } });
    const icn = icnId ? await prisma.iCN.findUnique({ where: { id: icnId } }) : null;

    await prisma.movementHistory.create({
      data: {
        eventType: "item_added_to_bin",
        binId,
        itemId,
        icnId,
        binItemId: binItem.id,
        quantityAfter: quantity,
        summary: `"${item?.name || "Unknown Item"}"${icn ? ` (${icn.value})` : ""} added to bin with quantity ${quantity}`,
      },
    });

    res.status(201).json(binItem);
  })
);

export default router;
