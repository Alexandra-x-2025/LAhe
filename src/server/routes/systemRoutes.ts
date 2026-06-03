import { Router } from "express";
import { logger } from "../logger";
import { getJournalLogs, getSystemStats } from "../systemService";

export const systemRoutes = Router();

systemRoutes.get("/stats", async (req, res) => {
  try {
    res.json(await getSystemStats());
  } catch (error) {
    logger.error({ error }, "Failed to fetch system stats");
    res.status(500).json({ error: "Failed to fetch system stats" });
  }
});

systemRoutes.get("/logs", async (req, res) => {
  try {
    res.json(await getJournalLogs());
  } catch (error) {
    logger.error({ error }, "Failed to fetch journal logs");
    res.json([]);
  }
});

