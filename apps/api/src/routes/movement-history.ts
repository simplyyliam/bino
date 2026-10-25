import { Router } from "express";
import { prisma } from "../db.js";
import { asyncHandler, requireString } from "../utils/errors.js";

const router = Router();

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { binId, itemId, icnId, limit } = req.query;
    // The timeline pages and filters client-side, so load a generous window
    // by default (it used to stop at 50 events, silently hiding older history).
    const requested = Number(limit);
    const take = Number.isInteger(requested) && requested > 0 ? Math.min(requested, 5000) : 1000;

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
    requireString(eventType, "eventType");
    requireString(summary, "summary");

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

router.delete(
  "/",
  asyncHandler(async (req, res) => {
    const { ids } = req.body as { ids?: unknown };

    if (!Array.isArray(ids) || ids.length === 0 || !ids.every((id) => typeof id === "string")) {
      res.status(400).json({ error: "ids must be a non-empty array of strings" });
      return;
    }

    await prisma.movementHistory.deleteMany({
      where: { id: { in: ids } },
    });

    res.status(204).send();
  })
);

export default router;
