import { parseAiChatResponse } from "../aiResponseParser";
import { extractCommandSuggestions } from "../commandExtractor";
import { config } from "../config";
import { inferCommandSafety, maxSafety } from "../commandSafety";
import { createMemory, listTopMemory } from "../db/repositories/memoryRepository";
import { listTopSkills, upsertSkill } from "../db/repositories/skillRepository";
import { logger } from "../logger";
import { ARCH_SYSTEM_PROMPT } from "../prompts/archSystemPrompt";
import type { ChatMessage } from "../types";
import { chatWithOllama } from "./ollamaClient";

export async function createChatResponse(input: {
  message: string;
  messages: ChatMessage[];
}) {
  const memory = listTopMemory(5);
  const skills = listTopSkills(5);
  const context = `CURRENT CONTEXT:\nPersistent Memory: ${JSON.stringify(memory)}\nLearned Skills: ${JSON.stringify(skills)}`;

  const ollamaMessages = [
    { role: "system" as const, content: `${ARCH_SYSTEM_PROMPT}\n\n${context}` },
    ...input.messages.slice(-10).map((item) => ({
      role: item.role === "ai" ? "assistant" as const : "user" as const,
      content: item.content,
    })),
    { role: "user" as const, content: input.message },
  ];

  logger.info({ model: config.ollamaModel, messageLength: input.message.length }, "Sending chat request to local model");
  const content = await chatWithOllama(ollamaMessages);
  const parsed = parseAiChatResponse(content);
  const commands = parsed.commands.length > 0 ? parsed.commands : extractCommandSuggestions(`${parsed.reply}\n${content}`);

  for (const item of parsed.memory) {
    createMemory(item);
  }

  for (const item of parsed.skills) {
    upsertSkill(item);
  }

  return {
    reply: parsed.reply,
    commands: commands.map((command) => ({
      ...command,
      safety: maxSafety(command.safety || "SOFT", inferCommandSafety(command.command || "")),
    })),
  };
}
