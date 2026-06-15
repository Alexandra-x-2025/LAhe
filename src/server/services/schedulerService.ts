import * as cron from "node-cron";
import { executeCommand } from "../commandService";
import { createCronJob as dbCreateCronJob, listCronJobs, updateCronJob } from "../db/repositories/cronRepository";
import { logger } from "../logger";
import { db } from "../db/client";

export interface CronJob {
  id: number;
  name: string;
  schedule: string;
  command: string;
  last_run: string | null;
  status: "active" | "disabled";
}

export interface ScheduledTask {
  id: number;
  name: string;
  schedule: string;
  command: string;
  task: cron.ScheduledTask | null;
}

// 存储活动的定时任务
const scheduledTasks = new Map<number, ScheduledTask>();

/**
 * 初始化调度器
 * 从数据库加载所有活动任务并启动它们
 */
export function initializeScheduler(): void {
  logger.info("Initializing task scheduler...");

  const jobs = listCronJobs() as CronJob[];

  for (const job of jobs) {
    if (job.status === "active") {
      startScheduledJob(job);
    }
  }

  logger.info(`Scheduler initialized with ${scheduledTasks.size} active tasks.`);
}

/**
 * 启动一个定时任务
 */
function startScheduledJob(job: CronJob): void {
  // 验证 cron 表达式
  if (!cron.validate(job.schedule)) {
    logger.warn({ job: job.name, schedule: job.schedule }, "Invalid cron expression");
    return;
  }

  const task = cron.schedule(job.schedule, async () => {
    logger.info({ job: job.name }, "Executing scheduled task");

    const result = await executeCommand({
      command: job.command,
      safety: "SOFT",
      confirmed: true,
    });

    // 更新最后执行时间
    updateCronJobLastRun(job.id, result);

    if (result.blocked) {
      logger.warn({ job: job.name, error: result.error }, "Scheduled task was blocked");
    } else if (result.error) {
      logger.warn({ job: job.name, exitCode: result.exitCode, error: result.error }, "Scheduled task failed");
    } else {
      logger.info({ job: job.name, exitCode: result.exitCode }, "Scheduled task completed successfully");
    }
  }, {
    timezone: "Asia/Shanghai", // 可配置
  });

  scheduledTasks.set(job.id, {
    id: job.id,
    name: job.name,
    schedule: job.schedule,
    command: job.command,
    task,
  });
}

/**
 * 停止一个定时任务
 */
function stopScheduledJob(id: number): void {
  const scheduledTask = scheduledTasks.get(id);

  if (scheduledTask?.task) {
    scheduledTask.task.stop();
    scheduledTasks.delete(id);
    logger.info({ taskId: id }, "Stopped scheduled task");
  }
}

/**
 * 创建新的定时任务
 */
export function createCronJob(input: { name: string; schedule: string; command: string }) {
  // 验证 cron 表达式
  if (!cron.validate(input.schedule)) {
    throw new Error(`Invalid cron expression: ${input.schedule}`);
  }

  // 保存到数据库
  const result = dbCreateCronJob(input);

  // 启动任务
  const job: CronJob = {
    id: result.id as number,
    name: input.name,
    schedule: input.schedule,
    command: input.command,
    last_run: null,
    status: "active",
  };

  startScheduledJob(job);

  logger.info({ job: input.name }, "Created and started scheduled task");

  return result;
}

/**
 * 删除定时任务
 */
export function deleteCronJob(id: number): boolean {
  // 停止任务
  stopScheduledJob(id);

  // 从数据库删除
  const result = db.prepare("DELETE FROM cron_jobs WHERE id = ?").run(id);

  return result.changes > 0;
}

/**
 * 启用/禁用定时任务
 */
export function toggleCronJob(id: number, enabled: boolean): void {
  const job = listCronJobs().find((j: CronJob) => j.id === id) as CronJob | undefined;

  if (!job) {
    throw new Error(`Job ${id} not found`);
  }

  if (enabled) {
    // 启用任务
    startScheduledJob(job);
    db.prepare("UPDATE cron_jobs SET status = 'active' WHERE id = ?").run(id);
  } else {
    // 禁用任务
    stopScheduledJob(id);
    db.prepare("UPDATE cron_jobs SET status = 'disabled' WHERE id = ?").run(id);
  }
}

/**
 * 更新任务执行记录
 */
function updateCronJobLastRun(id: number, result: any): void {
  db.prepare(`
    UPDATE cron_jobs
    SET last_run = ?
    WHERE id = ?
  `).run(new Date().toISOString(), id);
}

/**
 * 获取所有活动任务的状态
 */
export function getScheduledJobsStatus(): Array<{
  id: number;
  name: string;
  schedule: string;
  status: "running" | "stopped";
}> {
  const jobs = listCronJobs() as CronJob[];

  return jobs.map((job) => ({
    id: job.id,
    name: job.name,
    schedule: job.schedule,
    status: scheduledTasks.has(job.id) ? "running" : "stopped",
  }));
}

/**
 * 手动触发任务执行
 */
export async function triggerJob(id: number) {
  const job = listCronJobs().find((j: CronJob) => j.id === id) as CronJob | undefined;

  if (!job) {
    throw new Error(`Job ${id} not found`);
  }

  logger.info({ job: job.name }, "Manually triggering task");

  const result = await executeCommand({
    command: job.command,
    safety: "SOFT",
    confirmed: true,
  });

  updateCronJobLastRun(id, result);

  return result;
}

/**
 * 停止调度器
 */
export function shutdownScheduler(): void {
  logger.info("Shutting down scheduler...");

  for (const task of scheduledTasks.values()) {
    if (task.task) {
      task.task.stop();
    }
  }

  scheduledTasks.clear();

  logger.info("Scheduler shut down");
}