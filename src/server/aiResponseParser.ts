import { aiChatResponseSchema } from "./schemas";
import type { AiChatResponse, AiSkill } from "./types";

export function extractJsonObject(text: string) {
  const trimmed = text.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) return trimmed;
  const match = trimmed.match(/\{[\s\S]*\}/);
  return match?.[0] || "";
}

export function parseAiChatResponse(text: string): AiChatResponse {
  try {
    const parsed = JSON.parse(extractJsonObject(text));
    const result = aiChatResponseSchema.safeParse(parsed);

    if (!result.success) {
      return { reply: text, commands: [], memory: [], skills: [] };
    }

    return {
      reply: result.data.reply || text,
      commands: result.data.commands,
      memory: result.data.memory,
      skills: result.data.skills.filter((skill): skill is AiSkill => Boolean(skill.commands)),
    };
  } catch {
    return { reply: text, commands: [], memory: [], skills: [] };
  }
}
