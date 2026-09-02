import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

import buildingsRouter from "./routes/buildings.js";
import storagesRouter from "./routes/storages.js";
import binsRouter from "./routes/bins.js";
import itemsRouter from "./routes/items.js";
import icnsRouter from "./routes/icns.js";
import binItemsRouter from "./routes/bin-items.js";
import locationSystemsRouter from "./routes/location-systems.js";
import movementHistoryRouter from "./routes/movement-history.js";
import { errorHandler } from "./utils/errors.js";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/buildings", buildingsRouter);
app.use("/api/storages", storagesRouter);
app.use("/api/bins", binsRouter);
app.use("/api/items", itemsRouter);
app.use("/api/icns", icnsRouter);
app.use("/api/bin-items", binItemsRouter);
app.use("/api/location-systems", locationSystemsRouter);
app.use("/api/movement-history", movementHistoryRouter);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});
