import { describe, expect, it } from "vitest";
import { redactSensitiveText, sanitizeOutput, truncateOutput } from "./outputSanitizer";

describe("output sanitizer", () => {
  it("redacts bearer tokens", () => {
    const result = redactSensitiveText("Authorization: Bearer abcdefghijklmnopqrstuvwxyz123456");
    expect(result).toContain("Bearer [REDACTED]");
    expect(result).not.toContain("abcdefghijklmnopqrstuvwxyz123456");
  });

  it("redacts key-value secrets", () => {
    const result = redactSensitiveText("password=super-secret api_key=\"abc1234567890\" access_token=tok_1234567890");
    expect(result).toContain("password=[REDACTED]");
    expect(result).toContain("api_key=[REDACTED]");
    expect(result).toContain("access_token=[REDACTED]");
    expect(result).not.toContain("super-secret");
  });

  it("redacts common token prefixes", () => {
    const result = redactSensitiveText("token ghp_abcdefghijklmnopqrstuvwxyz1234567890 sk-abcdefghijklmnopqrstuvwxyz1234567890");
    expect(result).toContain("[REDACTED]");
    expect(result).not.toContain("ghp_abcdefghijklmnopqrstuvwxyz");
    expect(result).not.toContain("sk-abcdefghijklmnopqrstuvwxyz");
  });

  it("truncates long output", () => {
    const result = truncateOutput("a".repeat(20), 8);
    expect(result).toContain("aaaaaaaa");
    expect(result).toContain("truncated 12 chars");
  });

  it("sanitizes before returning output", () => {
    const result = sanitizeOutput("password=secret " + "a".repeat(20), 18);
    expect(result).toContain("password=[REDACT");
    expect(result).toContain("truncated");
    expect(result).not.toContain("secret");
  });
});

