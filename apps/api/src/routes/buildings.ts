import { Router } from "express";
import { prisma } from "../db.js";
import { asyncHandler, notFound } from "../utils/errors.js";

const router = Router();

router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const buildings = await prisma.building.findMany({ orderBy: { createdAt: "asc" } });
    res.json(buildings);
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const building = await prisma.building.findUnique({ where: { id: req.params.id } });
    if (!building) throw notFound("Building");
    res.json(building);
  })
);

router.post(
  "/",
  asyncHandler(async (req, res) => {
    const { name, buildingNumber } = req.body;
    const building = await prisma.building.create({
      data: { name, buildingNumber },
    });
    res.status(201).json(building);
  })
);

router.patch(
  "/:id",
  asyncHandler(async (req, res) => {
    const { name, buildingNumber } = req.body;
    const building = await prisma.building.update({
      where: { id: req.params.id },
      data: { name, buildingNumber },
    });
    res.json(building);
  })
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    // Storages -> Bins -> BinItems/MovementHistory cascade via Prisma onDelete rules.
    await prisma.building.delete({ where: { id: req.params.id } });
    res.status(204).send();
  })
);

export default router;
