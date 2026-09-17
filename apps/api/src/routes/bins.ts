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

    // Pull the storage together with its locationSystem in one query (a
    // join, not a second round-trip), and the existing bins in parallel.
    const [storage, existingBins] = await Promise.all([
      prisma.storage.findUnique({
        where: { id: storageId },
        include: { locationSystem: true },
      }),
      prisma.bin.findMany({ where: { storageId } }),
    ]);
    if (!storage) throw notFound("Storage");
    const locationSystem = storage.locationSystem;
    if (!locationSystem) throw notFound("LocationSystem");

    const nextLocation = getNextBinLocation(
      storage as any,
      existingBins as any,
      locationSystem as any
    );
    const locationCode = generateLocationCode(nextLocation, locationSystem as any);
    const expanded = expandStorage(storage as any, nextLocation);

    // Create the bin and update the storage's dimensions together in one
    // round-trip instead of two sequential ones.
    const [bin, updatedStorage] = await prisma.$transaction([
      prisma.bin.create({
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
      }),
      prisma.storage.update({
        where: { id: storageId },
        data: {
          maxLevel: expanded.maxLevel,
          maxRow: expanded.maxRow,
          maxColumn: expanded.maxColumn,
        },
      }),
    ]);

    // Return the storage alongside the bin so the client doesn't need a
    // second round-trip to pick up the updated dimensions.
    res.status(201).json({ ...bin, storage: updatedStorage });
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

// Create multiple bins in a storage in one request (e.g. "add column"),
// instead of the client looping N sequential POST /api/bins calls.
router.post(
  "/batch",
  asyncHandler(async (req, res) => {
    const { storageId, count, name } = req.body;
    const n = Math.max(1, Number(count) || 1);

    const storage = await prisma.storage.findUnique({ where: { id: storageId } });
    if (!storage) throw notFound("Storage");

    const [locationSystem, existingBins] = await Promise.all([
      prisma.locationSystem.findUnique({ where: { id: storage.locationSystemId } }),
      prisma.bin.findMany({ where: { storageId } }),
    ]);
    if (!locationSystem) throw notFound("LocationSystem");

    // Compute all N locations in memory against a running occupied set,
    // then create them together instead of round-tripping per bin.
    const runningBins = [...existingBins];
    let maxLevel = storage.maxLevel;
    let maxRow = storage.maxRow;
    let maxColumn = storage.maxColumn;
    const toCreate = [];
    for (let i = 0; i < n; i++) {
      const nextLocation = getNextBinLocation(storage as any, runningBins as any, locationSystem as any);
      const locationCode = generateLocationCode(nextLocation, locationSystem as any);
      const newBin = {
        storageId,
        name: name || `Bin ${existingBins.length + i + 1}`,
        locationCode,
        level: nextLocation.level,
        row: nextLocation.row,
        column: nextLocation.column,
        position: nextLocation.position,
        quantity: 0,
        isOutOfService: false,
      };
      toCreate.push(newBin);
      runningBins.push(newBin as any);
      maxLevel = Math.max(maxLevel, nextLocation.level);
      maxRow = Math.max(maxRow, nextLocation.row);
      maxColumn = Math.max(maxColumn, nextLocation.column);
    }

    const [bins, updatedStorage] = await prisma.$transaction([
      prisma.bin.createManyAndReturn({ data: toCreate }),
      prisma.storage.update({
        where: { id: storageId },
        data: { maxLevel, maxRow, maxColumn },
      }),
    ]);

    res.status(201).json({ bins, storage: updatedStorage });
  })
);

// Delete one or more bins by id in one request, and recompute the storage's
// grid dimensions from whatever bins remain. Used for both single "remove
// bin" and "remove column" so neither pays more than one round-trip.
router.post(
  "/batch-delete",
  asyncHandler(async (req, res) => {
    const { storageId, ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      res.json({ storage: null });
      return;
    }

    await prisma.bin.deleteMany({ where: { id: { in: ids } } });

    const remainingBins = await prisma.bin.findMany({ where: { storageId } });
    const maxLevel = remainingBins.length > 0 ? Math.max(...remainingBins.map((b) => b.level)) : 0;
    const maxRow = remainingBins.length > 0 ? Math.max(...remainingBins.map((b) => b.row)) : 0;
    const maxColumn = remainingBins.length > 0 ? Math.max(...remainingBins.map((b) => b.column)) : 0;

    const updatedStorage = await prisma.storage.update({
      where: { id: storageId },
      data: { maxLevel, maxRow, maxColumn },
    });

    res.json({ storage: updatedStorage });
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

    const historyEvent = await prisma.movementHistory.create({
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

    res.status(201).json({ binItem, historyEvent });
  })
);

export default router;
