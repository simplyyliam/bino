import { Router } from "express";
import { prisma } from "../db.js";
import {
  asyncHandler,
  badRequest,
  notFound,
  optionalQuantity,
  optionalString,
  requireString,
} from "../utils/errors.js";

const router = Router();

// Mounted at /api/bin-items. Bin-scoped listing/creation lives under
// /api/bins/:binId/items in bins.ts.

const binLabel = (bin: { name: string; locationCode: string }) =>
  bin.name ? `${bin.name} (${bin.locationCode})` : bin.locationCode;

router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const binItems = await prisma.binItem.findMany({ orderBy: { addedAt: "asc" } });
    res.json(binItems);
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const binItem = await prisma.binItem.findUnique({ where: { id: req.params.id } });
    if (!binItem) throw notFound("BinItem");
    res.json(binItem);
  })
);

router.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const quantity = optionalQuantity(req.body.quantity);
    const notes = req.body.notes === null ? null : optionalString(req.body.notes);
    // `null` clears the low-stock threshold; undefined leaves it alone.
    const minQuantity =
      req.body.minQuantity === null ? null : optionalQuantity(req.body.minQuantity, "minQuantity");

    const existing = await prisma.binItem.findUnique({ where: { id: req.params.id } });
    if (!existing) throw notFound("BinItem");

    const binItem = await prisma.binItem.update({
      where: { id: req.params.id },
      data: { quantity, notes, minQuantity },
    });

    let historyEvent = null;
    if (quantity !== undefined && quantity !== existing.quantity) {
      const item = await prisma.item.findUnique({ where: { id: existing.itemId } });
      historyEvent = await prisma.movementHistory.create({
        data: {
          eventType: quantity > existing.quantity ? "quantity_increased" : "quantity_decreased",
          binId: existing.binId,
          itemId: existing.itemId,
          icnId: existing.icnId,
          binItemId: existing.id,
          quantityBefore: existing.quantity,
          quantityAfter: quantity,
          reason: optionalString(req.body.reason),
          summary: `"${item?.name || "Unknown Item"}" quantity changed: ${existing.quantity} → ${quantity}`,
        },
      });
    }

    res.json({ binItem, historyEvent });
  })
);

// Move an item (all of it) into another bin. If the target bin already holds
// the same item, the quantities are merged into that row.
router.post(
  "/:id/move",
  asyncHandler(async (req, res) => {
    const toBinId = requireString(req.body.toBinId, "toBinId");

    const existing = await prisma.binItem.findUnique({
      where: { id: req.params.id },
      include: { item: true, bin: true },
    });
    if (!existing) throw notFound("BinItem");
    if (existing.binId === toBinId) throw badRequest("The item is already in that bin");

    const toBin = await prisma.bin.findUnique({ where: { id: toBinId } });
    if (!toBin) throw notFound("Bin");

    const target = await prisma.binItem.findFirst({
      where: { binId: toBinId, itemId: existing.itemId, icnId: existing.icnId },
    });

    const summary = `"${existing.item.name}" moved from ${binLabel(existing.bin)} to ${binLabel(toBin)}`;

    const result = await prisma.$transaction(async (tx) => {
      const historyEvent = await tx.movementHistory.create({
        data: {
          eventType: "item_moved_between_bins",
          binId: toBinId,
          itemId: existing.itemId,
          icnId: existing.icnId,
          binItemId: target?.id ?? existing.id,
          fromBinId: existing.binId,
          toBinId,
          quantityBefore: existing.quantity,
          quantityAfter: existing.quantity + (target?.quantity ?? 0),
          summary,
        },
      });

      if (target) {
        const binItem = await tx.binItem.update({
          where: { id: target.id },
          data: { quantity: target.quantity + existing.quantity },
        });
        await tx.binItem.delete({ where: { id: existing.id } });
        return { binItem, removedBinItemId: existing.id, historyEvent };
      }

      const binItem = await tx.binItem.update({
        where: { id: existing.id },
        data: { binId: toBinId },
      });
      return { binItem, removedBinItemId: null, historyEvent };
    });

    res.json(result);
  })
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const existing = await prisma.binItem.findUnique({ where: { id: req.params.id } });
    if (!existing) throw notFound("BinItem");

    const [item, icn, bin] = await Promise.all([
      prisma.item.findUnique({ where: { id: existing.itemId } }),
      existing.icnId ? prisma.iCN.findUnique({ where: { id: existing.icnId } }) : null,
      prisma.bin.findUnique({ where: { id: existing.binId } }),
    ]);

    // Write the history row BEFORE deleting the bin item. Doing it afterwards
    // violates the MovementHistory_binItemId_fkey constraint (P2003). The relation
    // uses `onDelete: SetNull`, so deleting the bin item simply nulls the reference.
    const [historyEvent] = await prisma.$transaction([
      prisma.movementHistory.create({
        data: {
          eventType: "item_removed_from_bin",
          binId: existing.binId,
          itemId: existing.itemId,
          icnId: existing.icnId,
          binItemId: existing.id,
          quantityBefore: existing.quantity,
          summary: `"${item?.name || "Unknown Item"}"${icn ? ` (${icn.value})` : ""} removed from bin${
            bin ? ` ${binLabel(bin)}` : ""
          }`,
        },
      }),
      prisma.binItem.delete({ where: { id: req.params.id } }),
    ]);

    res.json({ historyEvent });
  })
);

export default router;
