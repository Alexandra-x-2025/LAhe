import { db } from "../client";
import type { CommandSafety } from "../../types";
import { sanitizeOutput } from "../../outputSanitizer";

export interface CommandExecutionRecord {
  command: string;
  safety: CommandSafety;
  confirmed: boolean;
  blocked: boolean;
  stdout?: string;
  stderr?: string;
  error?: string;
  exitCode?: number | null;
}

export function createCommandExecution(input: CommandExecutionRecord) {
  const info = db
    .prepare(`
      INSERT INTO command_executions (
        command,
        safety,
        confirmed,
        blocked,
        stdout,
        stderr,
        error,
        exit_code
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .run(
      sanitizeOutput(input.command),
      input.safety,
      input.confirmed ? 1 : 0,
      input.blocked ? 1 : 0,
      sanitizeOutput(input.stdout || ""),
      sanitizeOutput(input.stderr || ""),
      sanitizeOutput(input.error || ""),
      input.exitCode ?? null
    );

  return { id: info.lastInsertRowid };
}

export function listRecentCommandExecutions(limit = 50) {
  return db
    .prepare("SELECT * FROM command_executions ORDER BY timestamp DESC LIMIT ?")
    .all(limit);
}
