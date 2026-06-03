import { db } from "../client";

export function listCronJobs() {
  return db.prepare("SELECT * FROM cron_jobs").all();
}

export function createCronJob(input: { name: string; schedule: string; command: string }) {
  const info = db
    .prepare("INSERT INTO cron_jobs (name, schedule, command) VALUES (?, ?, ?)")
    .run(input.name, input.schedule, input.command);

  return { id: info.lastInsertRowid };
}

