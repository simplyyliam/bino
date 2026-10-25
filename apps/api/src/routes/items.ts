import { Router } from "express";
import { prisma } from "../db.js";
import { asyncHandler, notFound, optionalString, requireString } from "../utils/errors.js";
import { Prisma } from "@prisma/client";

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
    const name = requireString(req.body.name, "name");
    const description = optionalString(req.body.description) || null;
    const category = optionalString(req.body.category) || null;
    const item = await prisma.item.create({ data: { name, description, category } });
    res.status(201).json(item);
  })
);

router.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const name = req.body.name === undefined ? undefined : requireString(req.body.name, "name");
    const description = req.body.description === null ? null : optionalString(req.body.description);
    const category = req.body.category === null ? null : optionalString(req.body.category);
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

    const item = await prisma.item.findUnique({ where: { id: itemId } });
    if (!item) throw notFound("Item");

    // Drop empty metadata fields so the record only stores what was entered.
    const cleanMetadata =
      metadata && typeof metadata === "object"
        ? (Object.fromEntries(
            Object.entries(metadata).filter(([, v]) => typeof v === "string" && v.trim() !== "")
          ) as Prisma.InputJsonObject)
        : undefined;

    const nextValue = async () => {
      const lastIcns = await prisma.iCN.findMany({ select: { value: true } });
      const maxIcnNumber = lastIcns.reduce((max: number, icn: { value: string }) => {
        const match = icn.value.match(/ICN-(\d+)/);
        return match ? Math.max(max, parseInt(match[1], 10)) : max;
      }, 0);
      return `ICN-${String(maxIcnNumber + 1).padStart(6, "0")}`;
    };

    // Two people creating ICNs at once can race to the same number; retry on the unique clash.
    let icn;
    for (let attempt = 0; ; attempt++) {
      const value = await nextValue();
      try {
        icn = await prisma.iCN.create({ data: { value, itemId, metadata: cleanMetadata } });
        break;
      } catch (err) {
        if (attempt < 3 && err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") continue;
        throw err;
      }
    }
    const value = icn.value;

    const historyEvent = await prisma.movementHistory.create({
      data: {
        eventType: "icn_created",
        icnId: icn.id,
        itemId,
        summary: `${value} created for "${item.name}"`,
      },
    });

    res.status(201).json({ icn, historyEvent });
  })
);

export default router;
