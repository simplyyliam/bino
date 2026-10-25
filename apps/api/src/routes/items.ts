import { Router } from "express";
import { prisma } from "../db.js";
import { ApiError, asyncHandler, badRequest, notFound, optionalString, requireString } from "../utils/errors.js";
import { icnProblem, nextIcnValue, normalizeIcn } from "@bino/data";
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
    // A typed ICN is used as-is; leave it out to get the next ICN-000123.
    const typed = optionalString(req.body.value);
    const custom = typed ? normalizeIcn(typed) : undefined;
    if (custom) {
      const problem = icnProblem(custom);
      if (problem) throw badRequest(problem);
    }
    // Optionally attach the new ICN to a row that's already in a bin.
    const binItemId = optionalString(req.body.binItemId) || null;

    const [item, binItem] = await Promise.all([
      prisma.item.findUnique({ where: { id: itemId } }),
      binItemId ? prisma.binItem.findUnique({ where: { id: binItemId }, include: { bin: true } }) : null,
    ]);
    if (!item) throw notFound("Item");
    if (binItemId) {
      if (!binItem || binItem.itemId !== itemId) throw notFound("BinItem");
      if (binItem.icnId) throw new ApiError(409, "That item already has an ICN.");
    }

    const taken = async (value: string) => {
      const clash = await prisma.iCN.findUnique({ where: { value }, include: { item: true } });
      return clash ? new ApiError(409, `${value} is already used by "${clash.item.name}". Try another.`) : null;
    };
    if (custom) {
      const clash = await taken(custom);
      if (clash) throw clash;
    }

    // Drop empty metadata fields so the record only stores what was entered.
    const cleanMetadata =
      metadata && typeof metadata === "object"
        ? (Object.fromEntries(
            Object.entries(metadata).filter(([, v]) => typeof v === "string" && v.trim() !== "")
          ) as Prisma.InputJsonObject)
        : undefined;

    const nextValue = async () => {
      const existing = await prisma.iCN.findMany({ select: { value: true } });
      return nextIcnValue(existing.map((icn) => icn.value));
    };

    // Two people creating ICNs at once can race to the same number; retry on the unique clash.
    let icn;
    for (let attempt = 0; ; attempt++) {
      const value = custom ?? (await nextValue());
      try {
        icn = await prisma.iCN.create({
          data: {
            value,
            itemId,
            metadata: cleanMetadata,
            binItems: binItemId ? { connect: { id: binItemId } } : undefined,
          },
        });
        break;
      } catch (err) {
        const clash = err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002";
        if (clash && custom) throw (await taken(custom)) ?? err;
        if (clash && attempt < 3) continue;
        throw err;
      }
    }
    const value = icn.value;

    const historyEvent = await prisma.movementHistory.create({
      data: {
        eventType: "icn_created",
        icnId: icn.id,
        itemId,
        binId: binItem?.binId,
        binItemId,
        summary: binItem
          ? `${value} given to "${item.name}" in bin ${binItem.bin.locationCode}`
          : `${value} created for "${item.name}"`,
      },
    });

    const updatedBinItem = binItemId ? await prisma.binItem.findUnique({ where: { id: binItemId } }) : undefined;
    res.status(201).json({ icn, binItem: updatedBinItem, historyEvent });
  })
);

export default router;
