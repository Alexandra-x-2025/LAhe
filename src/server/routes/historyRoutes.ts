import { Router } from "express";
import { createHistory, listRecentHistory } from "../db/repositories/historyRepository";
import { historyCreateRequestSchema } from "../schemas";

export const historyRoutes = Router();

historyRoutes.get("/", (req, res) => {
  res.json(listRecentHistory(50));
});

historyRoutes.post("/", (req, res) => {
  const request = historyCreateRequestSchema.safeParse(req.body);

  if (!request.success) {
    return res.status(400).json({ error: request.error.issues[0]?.message || "Invalid history request." });
  }

  const { query, response } = request.data;
  res.json(createHistory(query, response));
});
