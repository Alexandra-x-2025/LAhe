import { db } from "../client";

export interface CronJob {
  id: number;
  name: string;
  schedule: string;
  command: string;
  last_run: string | null;
  status: string;
}

export function listCronJobs(): CronJob[] {
  return db.prepare("SELECT * FROM cron_jobs ORDER BY id DESC").all() as CronJob[];
}

export function getCronJob(id: number): CronJob | undefined {
  return db.prepare("SELECT * FROM cron_jobs WHERE id = ?").get(id) as CronJob | undefined;
}

export function createCronJob(input: { name: string; schedule: string; command: string }) {
  const info = db
    .prepare("INSERT INTO cron_jobs (name, schedule, command) VALUES (?, ?, ?)")
    .run(input.name, input.schedule, input.command);

  return { id: info.lastInsertRowid };
}

export function deleteCronJob(id: number): boolean {
  const result = db.prepare("DELETE FROM cron_jobs WHERE id = ?").run(id);
  return result.changes > 0;
}

export function updateCronJob(id: number, updates: Partial<CronJob>): boolean {
  const fields: string[] = [];
  const values: any[] = [];

  if (updates.name !== undefined) {
    fields.push("name = ?");
    values.push(updates.name);
  }
  if (updates.schedule !== undefined) {
    fields.push("schedule = ?");
    values.push(updates.schedule);
  }
  if (updates.command !== undefined) {
    fields.push("command = ?");
    values.push(updates.command);
  }
  if (updates.status !== undefined) {
    fields.push("status = ?");
    values.push(updates.status);
  }

  if (fields.length === 0) {
    return false;
  }

  values.push(id);

  const result = db
    .prepare(`UPDATE cron_jobs SET ${fields.join(", ")} WHERE id = ?`)
    .run(...values);

  return result.changes > 0;
}

export function updateCronJobLastRun(id: number, lastRun: string): boolean {
  const result = db
    .prepare("UPDATE cron_jobs SET last_run = ? WHERE id = ?")
    .run(lastRun, id);

  return result.changes > 0;
}

