import { Router } from "express";
import { prisma } from "../db.js";
import { generateLocationCode } from "@bino/data";
import { asyncHandler, badRequest, notFound, optionalString, requireString } from "../utils/errors.js";
import { assertStoreNumberFree, nextStoreNumber } from "../utils/store-numbers.js";

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

// Reads an optional store number from the body: undefined = not sent, null = clear it.
const readStoreNumber = (value: unknown) => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const n = Number(value);
  if (!Number.isInteger(n) || n < 0) throw badRequest("Store number must be a whole number");
  return n;
};

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const buildingId = requireString(req.body.buildingId, "buildingId");
    const locationSystemId = requireString(req.body.locationSystemId, "locationSystemId");
    const name = optionalString(req.body.name) || "Main Storage";
    const { maxLevel, maxRow, maxColumn } = req.body;

    const system = await prisma.locationSystem.findUnique({ where: { id: locationSystemId } });
    if (!system) throw notFound("LocationSystem");

    // New buildings get the next free store number so their codes never
    // collide with another building on the same format.
    let storeNumber = readStoreNumber(req.body.storeNumber) ?? null;
    if (storeNumber === null) storeNumber = await nextStoreNumber(system as any);
    else await assertStoreNumberFree(system as any, storeNumber);

    const storage = await prisma.storage.create({
      data: {
        buildingId,
        name,
        locationSystemId,
        storeNumber,
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
    const storeNumber = readStoreNumber(req.body.storeNumber);

    const existing = await prisma.storage.findUnique({ where: { id: req.params.id } });
    if (!existing) throw notFound("Storage");

    const targetSystemId = locationSystemId ?? existing.locationSystemId;
    const effectiveNumber = storeNumber !== undefined ? storeNumber : existing.storeNumber;
    if (effectiveNumber !== null && (storeNumber !== undefined || locationSystemId)) {
      const system = await prisma.locationSystem.findUnique({ where: { id: targetSystemId } });
      if (!system) throw notFound("LocationSystem");
      await assertStoreNumberFree(system as any, effectiveNumber, existing.id);
    }

    const storage = await prisma.storage.update({
      where: { id: req.params.id },
      data: { name, locationSystemId, storeNumber, maxLevel, maxRow, maxColumn },
      include: { locationSystem: true, bins: true },
    });

    // A new format or a new store number means every bin in here needs a new code.
    let updatedBinCount = 0;
    if (locationSystemId || storeNumber !== undefined) {
      const updates = storage.bins
        .map((bin) => ({ bin, code: generateLocationCode(bin, storage.locationSystem as any, storage.storeNumber) }))
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
