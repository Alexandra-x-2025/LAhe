import { describe, expect, it } from "vitest";
import { extractCommandSuggestions } from "./commandExtractor";

describe("command extractor", () => {
  it("extracts common Linux commands from plain text", () => {
    const result = extractCommandSuggestions("可以运行 journalctl -p err -b 查看错误，然后 systemctl status bluetooth。");

    expect(result.map((item) => item.command)).toContain("journalctl -p err -b");
    expect(result.some((item) => item.command.startsWith("systemctl status bluetooth"))).toBe(true);
  });

  it("deduplicates extracted commands", () => {
    const result = extractCommandSuggestions("journalctl -n 50\njournalctl -n 50");

    expect(result).toHaveLength(1);
  });

  it("ignores explanatory text that continues with CJK characters", () => {
    const result = extractCommandSuggestions("请打开 systemctl 状态页面来诊断配置问题，然后运行 journalctl -n 50。");

    expect(result.map((item) => item.command)).not.toContain("systemctl 状态页面来诊断配置问题");
    expect(result.map((item) => item.command)).toContain("journalctl -n 50");
  });
});
