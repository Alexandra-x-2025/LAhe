import { db } from "../client";

export interface Setting {
  id: number;
  key: string;
  value: string;
  category: string;
  updated_at: string;
}

export function getSetting(key: string): string | null {
  const row = db.prepare("SELECT value FROM settings WHERE key = ?").get(key) as { value: string } | undefined;
  return row?.value || null;
}

export function getSettingOrDefault(key: string, defaultValue: string): string {
  return getSetting(key) || defaultValue;
}

export function getAllSettings(): Setting[] {
  return db.prepare("SELECT * FROM settings ORDER BY category, key").all() as Setting[];
}

export function getSettingsByCategory(category: string): Setting[] {
  return db.prepare("SELECT * FROM settings WHERE category = ? ORDER BY key").all(category) as Setting[];
}

export function upsertSetting(key: string, value: string, category: string = "general"): Setting {
  const now = new Date().toISOString();

  // 尝试更新
  const updateResult = db.prepare(`
    UPDATE settings
    SET value = ?, category = ?, updated_at = ?
    WHERE key = ?
  `).run(value, category, now, key);

  // 如果没有更新行，则插入
  if (updateResult.changes === 0) {
    const insertResult = db.prepare(`
      INSERT INTO settings (key, value, category, updated_at)
      VALUES (?, ?, ?, ?)
    `).run(key, value, category, now);

    return {
      id: insertResult.lastInsertRowid as number,
      key,
      value,
      category,
      updated_at: now,
    };
  }

  return {
    id: 0,
    key,
    value,
    category,
    updated_at: now,
  };
}

export function deleteSetting(key: string): boolean {
  const result = db.prepare("DELETE FROM settings WHERE key = ?").run(key);
  return result.changes > 0;
}

export function clearSettingsByCategory(category: string): number {
  const result = db.prepare("DELETE FROM settings WHERE category = ?").run(category);
  return result.changes;
}