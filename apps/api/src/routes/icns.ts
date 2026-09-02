import { Router } from "express";
import { prisma } from "../db.js";
import { asyncHandler, notFound } from "../utils/errors.js";

const router = Router();

// Mounted at /api/icns. Item-scoped ICN routes (list/create for a given item)
// live under /api/items/:itemId/icns in items.ts.

router.get(
  "/",
  asyncHandler(async (_req, res) => {
    const icns = await prisma.iCN.findMany({ orderBy: { createdAt: "asc" } });
    res.json(icns);
  })
);

router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const icn = await prisma.iCN.findUnique({ where: { id: req.params.id } });
    if (!icn) throw notFound("ICN");
    res.json(icn);
  })
);

router.get(
  "/by-value/:value",
  asyncHandler(async (req, res) => {
    const icn = await prisma.iCN.findUnique({ where: { value: req.params.value } });
    if (!icn) throw notFound("ICN");
    res.json(icn);
  })
);

router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    await prisma.iCN.delete({ where: { id: req.params.id } });
    res.status(204).send();
  })
);

export default router;
