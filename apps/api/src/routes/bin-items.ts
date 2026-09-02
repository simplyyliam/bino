import { Router } from "express";
import { prisma } from "../db.js";
import { asyncHandler, notFound } from "../utils/errors.js";

const router = Router();

// Mounted at /api/bin-items. Bin-scoped listing/creation lives under
// /api/bins/:binId/items in bins.ts.

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
    const { quantity, notes } = req.body;
    const existing = await prisma.binItem.findUnique({ where: { id: req.params.id } });
    if (!existing) throw notFound("BinItem");

    const binItem = await prisma.binItem.update({
      where: { id: req.params.id },
      data: { quantity, notes },
    });

    if (quantity !== undefined && quantity !== existing.quantity) {
      const item = await prisma.item.findUnique({ where: { id: existing.itemId } });
      await prisma.movementHistory.create({
        data: {
          eventType: quantity > existing.quantity ? "quantity_increased" : "quantity_decreased",
          binId: existing.binId,
          itemId: existing.itemId,
          icnId: existing.icnId,
          binItemId: existing.id,
          quantityBefore: existing.quantity,
          quantityAfter: quantity,
          summary: `"${item?.name || "Unknown Item"}" quantity changed: ${existing.quantity} → ${quantity}`,
        },
      });
    }

    res.json(binItem);
  })
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const existing = await prisma.binItem.findUnique({ where: { id: req.params.id } });
    if (!existing) throw notFound("BinItem");

    const item = await prisma.item.findUnique({ where: { id: existing.itemId } });
    const icn = existing.icnId ? await prisma.iCN.findUnique({ where: { id: existing.icnId } }) : null;

    await prisma.binItem.delete({ where: { id: req.params.id } });

    await prisma.movementHistory.create({
      data: {
        eventType: "item_removed_from_bin",
        binId: existing.binId,
        itemId: existing.itemId,
        icnId: existing.icnId,
        binItemId: existing.id,
        quantityBefore: existing.quantity,
        summary: `"${item?.name || "Unknown Item"}"${icn ? ` (${icn.value})` : ""} removed from bin`,
      },
    });

    res.status(204).send();
  })
);

export default router;
