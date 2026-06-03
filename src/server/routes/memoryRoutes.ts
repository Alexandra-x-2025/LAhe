import { Router } from "express";
import { createMemory, listMemory } from "../db/repositories/memoryRepository";
import { memoryCreateRequestSchema } from "../schemas";

export const memoryRoutes = Router();

memoryRoutes.get("/", (req, res) => {
  res.json(listMemory());
});

memoryRoutes.post("/", (req, res) => {
  const request = memoryCreateRequestSchema.safeParse(req.body);

  if (!request.success) {
    return res.status(400).json({ error: request.error.issues[0]?.message || "Invalid memory request." });
  }

  res.json(createMemory(request.data));
});
