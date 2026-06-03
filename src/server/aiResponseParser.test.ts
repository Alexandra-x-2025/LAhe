import { describe, expect, it } from "vitest";
import { extractJsonObject, parseAiChatResponse } from "./aiResponseParser";

describe("AI response parser", () => {
  it("extracts JSON from plain JSON text", () => {
    const json = '{"reply":"ok","commands":[]}';
    expect(extractJsonObject(json)).toBe(json);
  });

  it("extracts JSON from mixed model output", () => {
    const text = 'Sure:\n{"reply":"ok","commands":[]}\nDone.';
    expect(extractJsonObject(text)).toBe('{"reply":"ok","commands":[]}');
  });

  it("parses valid structured responses", () => {
    const result = parseAiChatResponse(JSON.stringify({
      reply: "检查日志",
      commands: [
        {
          command: "journalctl -p err -b",
          safety: "SOFT",
          explanation: "查看本次启动错误日志",
        },
      ],
    }));

    expect(result.reply).toBe("检查日志");
    expect(result.commands).toHaveLength(1);
    expect(result.commands[0].safety).toBe("SOFT");
  });

  it("falls back to plain reply when JSON is invalid", () => {
    const result = parseAiChatResponse("普通文本回复");

    expect(result.reply).toBe("普通文本回复");
    expect(result.commands).toEqual([]);
    expect(result.memory).toEqual([]);
    expect(result.skills).toEqual([]);
  });

  it("rejects malformed commands and falls back safely", () => {
    const result = parseAiChatResponse(JSON.stringify({
      reply: "bad",
      commands: [{ command: "", safety: "INVALID" }],
    }));

    expect(result.reply).toContain("commands");
    expect(result.commands).toEqual([]);
  });
});

