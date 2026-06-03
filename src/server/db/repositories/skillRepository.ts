import { db } from "../client";
import type { AiSkill } from "../../types";

export function listSkills() {
  return db.prepare("SELECT * FROM skills ORDER BY efficacy DESC").all();
}

export function listTopSkills(limit = 5) {
  return db.prepare("SELECT * FROM skills ORDER BY efficacy DESC LIMIT ?").all(limit);
}

export function upsertSkill(input: AiSkill) {
  const info = db
    .prepare("INSERT OR REPLACE INTO skills (name, pattern, commands) VALUES (?, ?, ?)")
    .run(input.name, input.pattern, Array.isArray(input.commands) ? JSON.stringify(input.commands) : input.commands);

  return { id: info.lastInsertRowid };
}

