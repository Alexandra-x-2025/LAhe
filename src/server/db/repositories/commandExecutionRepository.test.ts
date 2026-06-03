import fs from "fs";
import os from "os";
import path from "path";
import { afterAll, describe, expect, it } from "vitest";

const tempDbPath = path.join(os.tmpdir(), `lahe-command-executions-${Date.now()}.db`);
process.env.DATABASE_PATH = tempDbPath;

const { closeDatabase } = await import("../client");
const { initializeSchema } = await import("../schema");
const { createCommandExecution, listRecentCommandExecutions } = await import("./commandExecutionRepository");

initializeSchema();

afterAll(() => {
  closeDatabase();
  fs.rmSync(tempDbPath, { force: true });
});

describe("command execution repository", () => {
  it("creates and lists command execution records", () => {
    const created = createCommandExecution({
      command: "journalctl -n 5",
      safety: "SOFT",
      confirmed: false,
      blocked: false,
      stdout: "ok",
      stderr: "",
      exitCode: 0,
    });

    expect(created.id).toBeTruthy();

    const records = listRecentCommandExecutions(10) as any[];
    expect(records).toHaveLength(1);
    expect(records[0].command).toBe("journalctl -n 5");
    expect(records[0].safety).toBe("SOFT");
    expect(records[0].blocked).toBe(0);
    expect(records[0].exit_code).toBe(0);
  });

  it("records blocked critical commands", () => {
    createCommandExecution({
      command: "rm -rf /",
      safety: "CRITICAL",
      confirmed: true,
      blocked: true,
      error: "blocked",
    });

    const records = listRecentCommandExecutions(10) as any[];
    const record = records.find((item) => item.command === "rm -rf /");
    expect(record.command).toBe("rm -rf /");
    expect(record.safety).toBe("CRITICAL");
    expect(record.blocked).toBe(1);
    expect(record.error).toBe("blocked");
  });

  it("sanitizes sensitive command output before storage", () => {
    createCommandExecution({
      command: "printenv",
      safety: "SOFT",
      confirmed: false,
      blocked: false,
      stdout: "password=super-secret-token",
      stderr: "Authorization: Bearer abcdefghijklmnopqrstuvwxyz123456",
      error: "api_key=abc1234567890",
    });

    const records = listRecentCommandExecutions(10) as any[];
    const record = records.find((item) => item.command === "printenv");
    expect(record.stdout).toContain("password=[REDACTED]");
    expect(record.stderr).toContain("Bearer [REDACTED]");
    expect(record.error).toContain("api_key=[REDACTED]");
    expect(record.stdout).not.toContain("super-secret-token");
  });

  it("sanitizes sensitive command text before storage", () => {
    createCommandExecution({
      command: "curl -H 'Authorization: Bearer abcdefghijklmnopqrstuvwxyz123456' https://example.test",
      safety: "SOFT",
      confirmed: false,
      blocked: false,
    });

    const records = listRecentCommandExecutions(10) as any[];
    const record = records.find((item) => item.command.includes("curl -H"));
    expect(record.command).toContain("Bearer [REDACTED]");
    expect(record.command).not.toContain("abcdefghijklmnopqrstuvwxyz123456");
  });
});
