import { Router } from "express";
import { listSkills, upsertSkill } from "../db/repositories/skillRepository";
import { skillUpsertRequestSchema } from "../schemas";

export const skillRoutes = Router();

skillRoutes.get("/", (req, res) => {
  res.json(listSkills());
});

skillRoutes.post("/", (req, res) => {
  const request = skillUpsertRequestSchema.safeParse(req.body);

  if (!request.success) {
    return res.status(400).json({ error: request.error.issues[0]?.message || "Invalid skill request." });
  }

  res.json(upsertSkill(request.data));
});
