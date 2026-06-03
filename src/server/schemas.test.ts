import { describe, expect, it } from "vitest";
import {
  cronCreateRequestSchema,
  historyCreateRequestSchema,
  memoryCreateRequestSchema,
  skillUpsertRequestSchema,
} from "./schemas";

describe("request schemas", () => {
  it("accepts valid history payloads", () => {
    const result = historyCreateRequestSchema.safeParse({
      query: "检查日志",
      response: "可以使用 journalctl。",
    });

    expect(result.success).toBe(true);
  });

  it("rejects empty history queries", () => {
    const result = historyCreateRequestSchema.safeParse({
      query: " ",
      response: "ok",
    });

    expect(result.success).toBe(false);
  });

  it("defaults memory importance to 1", () => {
    const result = memoryCreateRequestSchema.parse({
      category: "desktop",
      content: "User uses KDE.",
    });

    expect(result.importance).toBe(1);
  });

  it("rejects out-of-range memory importance", () => {
    const result = memoryCreateRequestSchema.safeParse({
      category: "desktop",
      content: "User uses KDE.",
      importance: 8,
    });

    expect(result.success).toBe(false);
  });

  it("accepts skill command arrays", () => {
    const result = skillUpsertRequestSchema.safeParse({
      name: "Network diagnostic",
      pattern: "NetworkManager failure",
      commands: ["systemctl status NetworkManager", "journalctl -u NetworkManager"],
    });

    expect(result.success).toBe(true);
  });

  it("rejects empty skill command arrays", () => {
    const result = skillUpsertRequestSchema.safeParse({
      name: "Network diagnostic",
      pattern: "NetworkManager failure",
      commands: [],
    });

    expect(result.success).toBe(false);
  });

  it("accepts valid cron job payloads", () => {
    const result = cronCreateRequestSchema.safeParse({
      name: "Check updates",
      schedule: "0 9 * * *",
      command: "checkupdates",
    });

    expect(result.success).toBe(true);
  });

  it("rejects cron jobs without commands", () => {
    const result = cronCreateRequestSchema.safeParse({
      name: "Check updates",
      schedule: "0 9 * * *",
      command: "",
    });

    expect(result.success).toBe(false);
  });
});

