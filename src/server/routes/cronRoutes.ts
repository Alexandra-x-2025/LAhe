import { Router } from "express";
import {
  listCronJobs,
  getCronJob,
  deleteCronJob as dbDeleteCronJob,
  updateCronJob,
} from "../db/repositories/cronRepository";
import {
  createCronJob,
  deleteCronJob,
  toggleCronJob,
  triggerJob,
  getScheduledJobsStatus,
} from "../services/schedulerService";
import { cronCreateRequestSchema } from "../schemas";
import { logger } from "../logger";

export const cronRoutes = Router();

/**
 * GET /api/cron
 * 获取所有定时任务
 */
cronRoutes.get("/", (req, res) => {
  const jobs = listCronJobs();
  const status = getScheduledJobsStatus();

  // 合并任务信息和运行状态
  const jobsWithStatus = jobs.map((job) => {
    const jobStatus = status.find((s) => s.id === job.id);
    return {
      ...job,
      running: jobStatus?.status === "running",
    };
  });

  res.json(jobsWithStatus);
});

/**
 * GET /api/cron/:id
 * 获取单个任务详情
 */
cronRoutes.get("/:id", (req, res) => {
  const id = Number(req.params.id);
  const job = getCronJob(id);

  if (!job) {
    return res.status(404).json({ error: "Job not found" });
  }

  const status = getScheduledJobsStatus();
  const jobStatus = status.find((s) => s.id === id);

  res.json({
    ...job,
    running: jobStatus?.status === "running",
  });
});

/**
 * POST /api/cron
 * 创建新的定时任务
 */
cronRoutes.post("/", (req, res) => {
  const request = cronCreateRequestSchema.safeParse(req.body);

  if (!request.success) {
    return res.status(400).json({ error: request.error.issues[0]?.message || "Invalid cron request." });
  }

  try {
    const result = createCronJob(request.data);
    res.json(result);
  } catch (error) {
    res.status(400).json({
      error: error instanceof Error ? error.message : "Failed to create cron job",
    });
  }
});

/**
 * PUT /api/cron/:id
 * 更新定时任务
 */
cronRoutes.put("/:id", (req, res) => {
  const id = Number(req.params.id);
  const job = getCronJob(id);

  if (!job) {
    return res.status(404).json({ error: "Job not found" });
  }

  const { name, schedule, command, status: jobStatus } = req.body;

  try {
    // 如果更新了 cron 表达式，需要重启任务
    if (schedule && schedule !== job.schedule) {
      // 验证新的 cron 表达式
      const cron = require("node-cron");
      if (!cron.validate(schedule)) {
        return res.status(400).json({ error: "Invalid cron expression" });
      }

      // 先停止旧任务
      const { deleteCronJob: schedulerDelete } = require("../services/schedulerService");
      schedulerDelete(id);

      // 更新数据库
      updateCronJob(id, { name, schedule, command, status: jobStatus });

      // 如果是激活状态，重新启动任务
      if (jobStatus !== "disabled") {
        const { listCronJobs: list } = require("../db/repositories/cronRepository");
        const updatedJob = list().find((j: any) => j.id === id);
        if (updatedJob) {
          const { createCronJob: create } = require("../services/schedulerService");
          create(updatedJob);
        }
      }
    } else {
      // 只更新其他字段，不重启任务
      updateCronJob(id, { name, command, status: jobStatus });

      // 如果只切换状态
      if (jobStatus !== undefined && jobStatus !== job.status) {
        toggleCronJob(id, jobStatus === "active");
      }
    }

    logger.info({ jobId: id }, "Updated cron job");

    res.json({ success: true, id });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to update cron job",
    });
  }
});

/**
 * DELETE /api/cron/:id
 * 删除定时任务
 */
cronRoutes.delete("/:id", (req, res) => {
  const id = Number(req.params.id);

  try {
    deleteCronJob(id);
    dbDeleteCronJob(id);

    logger.info({ jobId: id }, "Deleted cron job");

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to delete cron job",
    });
  }
});

/**
 * POST /api/cron/:id/trigger
 * 手动触发任务执行
 */
cronRoutes.post("/:id/trigger", async (req, res) => {
  const id = Number(req.params.id);

  try {
    const result = await triggerJob(id);
    res.json(result);
  } catch (error) {
    res.status(404).json({
      error: error instanceof Error ? error.message : "Failed to trigger job",
    });
  }
});

/**
 * POST /api/cron/:id/toggle
 * 启用/禁用任务
 */
cronRoutes.post("/:id/toggle", (req, res) => {
  const id = Number(req.params.id);
  const { enabled } = req.body;

  if (typeof enabled !== "boolean") {
    return res.status(400).json({ error: "enabled field is required (boolean)" });
  }

  try {
    toggleCronJob(id, enabled);

    logger.info({ jobId: id, enabled }, "Toggled cron job");

    res.json({ success: true, enabled });
  } catch (error) {
    res.status(404).json({
      error: error instanceof Error ? error.message : "Failed to toggle job",
    });
  }
});
