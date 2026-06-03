import { db } from "../client";
import type { AiMemory } from "../../types";

export function listMemory() {
  return db.prepare("SELECT * FROM memory ORDER BY importance DESC, timestamp DESC").all();
}

export function listTopMemory(limit = 5) {
  return db.prepare("SELECT * FROM memory ORDER BY importance DESC, timestamp DESC LIMIT ?").all(limit);
}

export function createMemory(input: AiMemory) {
  const info = db
    .prepare("INSERT INTO memory (category, content, importance) VALUES (?, ?, ?)")
    .run(input.category, input.content, input.importance || 1);

  return { id: info.lastInsertRowid };
}

