import { Router } from "express";
import { createCronJob, listCronJobs } from "../db/repositories/cronRepository";
import { cronCreateRequestSchema } from "../schemas";

export const cronRoutes = Router();

cronRoutes.get("/", (req, res) => {
  res.json(listCronJobs());
});

cronRoutes.post("/", (req, res) => {
  const request = cronCreateRequestSchema.safeParse(req.body);

  if (!request.success) {
    return res.status(400).json({ error: request.error.issues[0]?.message || "Invalid cron request." });
  }

  res.json(createCronJob(request.data));
});
