import { Router } from "express";
import { prisma } from "../db.js";
import { asyncHandler } from "../utils/errors.js";

const router = Router();

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { binId, itemId, icnId, limit } = req.query;
    const take = limit ? Number(limit) : 50;

    const where = binId
      ? {
          OR: [
            { binId: String(binId) },
            { fromBinId: String(binId) },
            { toBinId: String(binId) },
          ],
        }
      : itemId
        ? { itemId: String(itemId) }
        : icnId
          ? { icnId: String(icnId) }
          : undefined;

    const events = await prisma.movementHistory.findMany({
      where,
      orderBy: { timestamp: "desc" },
      take,
    });
    res.json(events);
  })
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const {
      eventType,
      binId,
      itemId,
      icnId,
      binItemId,
      fromBinId,
      toBinId,
      quantityBefore,
      quantityAfter,
      reason,
      user,
      summary,
    } = req.body;

    const event = await prisma.movementHistory.create({
      data: {
        eventType,
        binId,
        itemId,
        icnId,
        binItemId,
        fromBinId,
        toBinId,
        quantityBefore,
        quantityAfter,
        reason,
        user,
        summary,
      },
    });
    res.status(201).json(event);
  })
);

export default router;
