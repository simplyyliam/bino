import { Router } from "express";
import { prisma } from "../db.js";
import {
  expandStorage,
  generateLocationCode,
  getNextBinLocation,
} from "@bino/data";
import {
  asyncHandler,
  badRequest,
  notFound,
  optionalQuantity,
  optionalString,
  requireString,
} from "../utils/errors.js";

const router = Router();

// Upper bound for a single batch create, so a typo ("5000") can't flood a storage.
const MAX_BATCH = 200;

const binLabel = (bin: { name: string; locationCode: string }) =>
  bin.name ? `${bin.name} (${bin.locationCode})` : bin.locationCode;

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
    const storageId = requireString(req.body.storageId, "storageId");
    const name = optionalString(req.body.name) ?? "";

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
    const locationCode = generateLocationCode(nextLocation, locationSystem as any, storage.storeNumber);
    const expanded = expandStorage(storage as any, nextLocation);

    // Create the bin and update the storage's dimensions together in one
    // round-trip instead of two sequential ones.
    const [bin, updatedStorage] = await prisma.$transaction([
      prisma.bin.create({
        data: {
          storageId,
          name,
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
    const { locationCode, itemId, isOutOfService, icon, level, row, column, position } = req.body;
    const name = optionalString(req.body.name);
    const quantity = optionalQuantity(req.body.quantity);

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

// Toggle a bin in/out of service and record it on the timeline.
router.post(
  "/:id/service",
  asyncHandler(async (req, res) => {
    const { isOutOfService } = req.body;
    if (typeof isOutOfService !== "boolean") {
      throw badRequest("isOutOfService must be true or false");
    }
    const reason = optionalString(req.body.reason);

    const existing = await prisma.bin.findUnique({ where: { id: req.params.id } });
    if (!existing) throw notFound("Bin");

    if (existing.isOutOfService === isOutOfService) {
      res.json({ bin: existing, historyEvent: null });
      return;
    }

    const [bin, historyEvent] = await prisma.$transaction([
      prisma.bin.update({ where: { id: existing.id }, data: { isOutOfService } }),
      prisma.movementHistory.create({
        data: {
          eventType: isOutOfService ? "marked_out_of_service" : "marked_serviceable",
          binId: existing.id,
          reason,
          summary: isOutOfService
            ? `Bin ${binLabel(existing)} marked out of service`
            : `Bin ${binLabel(existing)} back in service`,
        },
      }),
    ]);

    res.json({ bin, historyEvent });
  })
);

// Zero every item in a bin in one transaction with a single timeline event,
// instead of the client patching each item (which logged N+1 events).
router.post(
  "/:id/out-of-stock",
  asyncHandler(async (req, res) => {
    const existing = await prisma.bin.findUnique({
      where: { id: req.params.id },
      include: { binItems: true },
    });
    if (!existing) throw notFound("Bin");

    const stocked = existing.binItems.filter((bi) => bi.quantity > 0);
    if (stocked.length === 0) {
      res.json({ binItems: existing.binItems, historyEvent: null });
      return;
    }

    const [, historyEvent] = await prisma.$transaction([
      prisma.binItem.updateMany({ where: { binId: existing.id }, data: { quantity: 0 } }),
      prisma.movementHistory.create({
        data: {
          eventType: "marked_out_of_stock",
          binId: existing.id,
          quantityBefore: stocked.reduce((sum, bi) => sum + bi.quantity, 0),
          quantityAfter: 0,
          summary: `Bin ${binLabel(existing)} marked out of stock (${stocked.length} ${
            stocked.length === 1 ? "item" : "items"
          } set to 0)`,
        },
      }),
    ]);

    const binItems = await prisma.binItem.findMany({ where: { binId: existing.id } });
    res.json({ binItems, historyEvent });
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
    const storageId = requireString(req.body.storageId, "storageId");
    const name = optionalString(req.body.name) ?? "";
    const n = Math.min(MAX_BATCH, Math.max(1, Math.floor(Number(req.body.count)) || 1));

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
      const locationCode = generateLocationCode(nextLocation, locationSystem as any, storage.storeNumber);
      const newBin = {
        storageId,
        name,
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
    const storageId = requireString(req.body.storageId, "storageId");
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      res.json({ storage: null });
      return;
    }

    // Scope the delete to the storage so a stale client can't remove bins elsewhere.
    await prisma.bin.deleteMany({ where: { id: { in: ids.map(String) }, storageId } });

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
    const itemId = requireString(req.body.itemId, "itemId");
    const icnId = optionalString(req.body.icnId) || null;
    const quantity = optionalQuantity(req.body.quantity) ?? 1;
    const minQuantity = optionalQuantity(req.body.minQuantity, "minQuantity") ?? null;
    const notes = optionalString(req.body.notes) || null;

    const [bin, item, icn] = await Promise.all([
      prisma.bin.findUnique({ where: { id: binId } }),
      prisma.item.findUnique({ where: { id: itemId } }),
      icnId ? prisma.iCN.findUnique({ where: { id: icnId } }) : Promise.resolve(null),
    ]);
    if (!bin) throw notFound("Bin");
    if (!item) throw notFound("Item");
    if (icnId && !icn) throw notFound("ICN");

    // Adding an item that's already in the bin tops up the existing row
    // instead of creating a confusing duplicate line.
    const existing = await prisma.binItem.findFirst({
      where: { binId, itemId, icnId },
    });

    if (existing) {
      const nextQuantity = existing.quantity + quantity;
      const [binItem, historyEvent] = await prisma.$transaction([
        prisma.binItem.update({
          where: { id: existing.id },
          data: { quantity: nextQuantity },
        }),
        prisma.movementHistory.create({
          data: {
            eventType: "quantity_increased",
            binId,
            itemId,
            icnId,
            binItemId: existing.id,
            quantityBefore: existing.quantity,
            quantityAfter: nextQuantity,
            summary: `"${item.name}" quantity changed: ${existing.quantity} → ${nextQuantity}`,
          },
        }),
      ]);
      res.status(200).json({ binItem, historyEvent, merged: true });
      return;
    }

    const binItem = await prisma.binItem.create({
      data: { binId, itemId, icnId, quantity, minQuantity, notes },
    });

    const historyEvent = await prisma.movementHistory.create({
      data: {
        eventType: "item_added_to_bin",
        binId,
        itemId,
        icnId,
        binItemId: binItem.id,
        quantityAfter: quantity,
        summary: `"${item.name}"${icn ? ` (${icn.value})` : ""} added to bin ${binLabel(bin)} with quantity ${quantity}`,
      },
    });

    res.status(201).json({ binItem, historyEvent, merged: false });
  })
);

export default router;
