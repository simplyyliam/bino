import { Router } from "express";
import { prisma } from "../db.js";
import { generateLocationCode } from "@bino/data";
import { ApiError, asyncHandler, badRequest, notFound } from "../utils/errors.js";

const router = Router();

// Reject configurations that would produce broken or empty location codes.
const validateSystem = (body: any, partial: boolean) => {
  if (!partial || body.name !== undefined) {
    if (typeof body.name !== "string" || !body.name.trim()) throw badRequest("Give the system a name");
  }
  if (body.paddingWidth !== undefined) {
    const n = Number(body.paddingWidth);
    if (!Number.isInteger(n) || n < 1 || n > 4) throw badRequest("Digits must be between 1 and 4");
  }
  if (body.separator !== undefined && typeof body.separator !== "string") {
    throw badRequest("Separator must be text");
  }
  if (!partial || body.levels !== undefined || body.mappingRules !== undefined) {
    if (!Array.isArray(body.levels) || body.levels.length === 0) throw badRequest("Add at least one level");
    if (!Array.isArray(body.mappingRules) || body.mappingRules.length !== body.levels.length) {
      throw badRequest("Every level needs a rule");
    }
  }
};

router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const systems = await prisma.locationSystem.findMany({ orderBy: { createdAt: "asc" } });
    res.json(systems);
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const system = await prisma.locationSystem.findUnique({ where: { id: req.params.id } });
    if (!system) throw notFound("LocationSystem");
    res.json(system);
  })
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    validateSystem(req.body, false);
    const { id, name, usesExistingCodes, separator, paddingWidth, levels, mappingRules, gridConfig } =
      req.body;
    const system = await prisma.locationSystem.create({
      data: {
        // Keep a client-provided id when it's a plain string so callers can reference it.
        ...(typeof id === "string" && id ? { id } : {}),
        name: name.trim(),
        usesExistingCodes: usesExistingCodes ?? true,
        separator,
        paddingWidth,
        levels,
        mappingRules,
        gridConfig,
      },
    });
    res.status(201).json(system);
  })
);

router.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    validateSystem(req.body, true);
    const { name, usesExistingCodes, separator, paddingWidth, levels, mappingRules, gridConfig } =
      req.body;
    const system = await prisma.locationSystem.update({
      where: { id: req.params.id },
      data: { name: name?.trim(), usesExistingCodes, separator, paddingWidth, levels, mappingRules, gridConfig },
    });

    // A system can be shared by several storages, so regenerate the codes of
    // every bin that uses it — not only the storage the editor was opened from.
    const bins = await prisma.bin.findMany({
      where: { storage: { locationSystemId: system.id } },
      include: { storage: { select: { storeNumber: true } } },
    });
    const updates = bins
      .map((bin) => ({ bin, code: generateLocationCode(bin, system as any, bin.storage.storeNumber) }))
      .filter(({ bin, code }) => code !== bin.locationCode)
      .map(({ bin, code }) =>
        prisma.bin.update({ where: { id: bin.id }, data: { locationCode: code } })
      );
    if (updates.length > 0) await prisma.$transaction(updates);

    res.json({ ...system, updatedBinCount: updates.length });
  })
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    const storageCount = await prisma.storage.count({
      where: { locationSystemId: req.params.id },
    });
    if (storageCount > 0) {
      throw new ApiError(409, "Cannot delete a location system still in use by storages");
    }
    await prisma.locationSystem.delete({ where: { id: req.params.id } });
    res.status(204).send();
  })
);

export default router;
