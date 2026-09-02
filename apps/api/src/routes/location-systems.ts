import { Router } from "express";
import { prisma } from "../db.js";
import { ApiError, asyncHandler, notFound } from "../utils/errors.js";

const router = Router();

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
    const { name, usesExistingCodes, separator, paddingWidth, levels, mappingRules, gridConfig } =
      req.body;
    const system = await prisma.locationSystem.create({
      data: {
        name,
        usesExistingCodes,
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
    const { name, usesExistingCodes, separator, paddingWidth, levels, mappingRules, gridConfig } =
      req.body;
    const system = await prisma.locationSystem.update({
      where: { id: req.params.id },
      data: { name, usesExistingCodes, separator, paddingWidth, levels, mappingRules, gridConfig },
    });
    res.json(system);
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
