import { db } from "./client";

export function initializeSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS interactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      query TEXT,
      response TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS skills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE,
      pattern TEXT,
      commands TEXT,
      efficacy REAL DEFAULT 1.0,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS memory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT,
      content TEXT,
      importance INTEGER DEFAULT 1,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS cron_jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      schedule TEXT,
      command TEXT,
      last_run DATETIME,
      status TEXT DEFAULT 'active'
    );

    CREATE TABLE IF NOT EXISTS command_executions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      command TEXT NOT NULL,
      safety TEXT NOT NULL,
      confirmed INTEGER DEFAULT 0,
      blocked INTEGER DEFAULT 0,
      stdout TEXT DEFAULT '',
      stderr TEXT DEFAULT '',
      error TEXT DEFAULT '',
      exit_code INTEGER,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);
}
