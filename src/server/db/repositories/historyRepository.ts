import { db } from "../client";

export function listRecentHistory(limit = 50) {
  return db.prepare("SELECT * FROM interactions ORDER BY timestamp DESC LIMIT ?").all(limit);
}

export function createHistory(query: string, response: string) {
  const info = db.prepare("INSERT INTO interactions (query, response) VALUES (?, ?)").run(query, response);
  return { id: info.lastInsertRowid };
}

