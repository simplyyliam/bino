import { Router } from "express";
import { prisma } from "../db.js";
import { generateLocationCode } from "@bino/data";
import { asyncHandler, notFound, optionalString, requireString } from "../utils/errors.js";

const router = Router();

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const { buildingId } = req.query;
    const storages = await prisma.storage.findMany({
      where: buildingId ? { buildingId: String(buildingId) } : undefined,
      orderBy: { createdAt: "asc" },
    });
    res.json(storages);
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const storage = await prisma.storage.findUnique({ where: { id: req.params.id } });
    if (!storage) throw notFound("Storage");
    res.json(storage);
  })
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const buildingId = requireString(req.body.buildingId, "buildingId");
    const locationSystemId = requireString(req.body.locationSystemId, "locationSystemId");
    const name = optionalString(req.body.name) || "Main Storage";
    const { maxLevel, maxRow, maxColumn } = req.body;
    const storage = await prisma.storage.create({
      data: {
        buildingId,
        name,
        locationSystemId,
        maxLevel: maxLevel ?? 0,
        maxRow: maxRow ?? 0,
        maxColumn: maxColumn ?? 0,
      },
    });
    res.status(201).json(storage);
  })
);

router.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const { name, locationSystemId, maxLevel, maxRow, maxColumn } = req.body;
    const storage = await prisma.storage.update({
      where: { id: req.params.id },
      data: { name, locationSystemId, maxLevel, maxRow, maxColumn },
      include: { locationSystem: true, bins: true },
    });

    // Switching code formats means every bin in here needs a new code.
    let updatedBinCount = 0;
    if (locationSystemId) {
      const updates = storage.bins
        .map((bin) => ({ bin, code: generateLocationCode(bin, storage.locationSystem as any) }))
        .filter(({ bin, code }) => code !== bin.locationCode)
        .map(({ bin, code }) => prisma.bin.update({ where: { id: bin.id }, data: { locationCode: code } }));
      if (updates.length > 0) await prisma.$transaction(updates);
      updatedBinCount = updates.length;
    }

    const { bins: _bins, locationSystem: _system, ...rest } = storage;
    res.json({ ...rest, updatedBinCount });
  })
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await prisma.storage.delete({ where: { id: req.params.id } });
    res.status(204).send();
  })
);

export default router;
