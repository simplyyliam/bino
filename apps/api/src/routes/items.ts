import { Router } from "express";
import { prisma } from "../db.js";
import { asyncHandler, notFound } from "../utils/errors.js";

const router = Router();

// --- Item routes ---

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { search } = req.query;
    if (!search) {
      const items = await prisma.item.findMany({ orderBy: { createdAt: "asc" } });
      res.json(items);
      return;
    }

    const query = String(search);
    const items = await prisma.item.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
          { category: { contains: query, mode: "insensitive" } },
        ],
      },
    });
    res.json(items);
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const item = await prisma.item.findUnique({ where: { id: req.params.id } });
    if (!item) throw notFound("Item");
    res.json(item);
  })
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const { name, description, category } = req.body;
    const item = await prisma.item.create({ data: { name, description, category } });
    res.status(201).json(item);
  })
);

router.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const { name, description, category } = req.body;
    const item = await prisma.item.update({
      where: { id: req.params.id },
      data: { name, description, category },
    });
    res.json(item);
  })
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await prisma.item.delete({ where: { id: req.params.id } });
    res.status(204).send();
  })
);

// --- ICN sub-routes ---

router.get(
  "/:itemId/icns",
  asyncHandler(async (req, res) => {
    const icns = await prisma.iCN.findMany({ where: { itemId: req.params.itemId } });
    res.json(icns);
  })
);

router.post(
  "/:itemId/icns",
  asyncHandler(async (req, res) => {
    const { itemId } = req.params;
    const { metadata } = req.body;

    const lastIcns = await prisma.iCN.findMany({
      select: { value: true },
    });
    const maxIcnNumber = lastIcns.reduce((max: number, icn: { value: string }) => {
      const match = icn.value.match(/ICN-(\d+)/);
      return match ? Math.max(max, parseInt(match[1], 10)) : max;
    }, 0);
    const value = `ICN-${String(maxIcnNumber + 1).padStart(6, "0")}`;

    const icn = await prisma.iCN.create({
      data: { value, itemId, metadata },
    });

    const item = await prisma.item.findUnique({ where: { id: itemId } });
    await prisma.movementHistory.create({
      data: {
        eventType: "icn_created",
        icnId: icn.id,
        itemId,
        summary: `${value} created for "${item?.name || "Unknown Item"}"`,
      },
    });

    res.status(201).json(icn);
  })
);

export default router;
