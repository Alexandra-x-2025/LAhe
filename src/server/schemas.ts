import { z } from "zod";

export const commandSafetySchema = z.enum(["SOFT", "MODERATE", "CRITICAL"]);

export const chatMessageSchema = z.object({
  role: z.enum(["user", "ai"]),
  content: z.string().min(1),
});

export const chatRequestSchema = z.object({
  message: z.string().trim().min(1, "Message is required."),
  messages: z.array(chatMessageSchema).default([]),
});

export const executeRequestSchema = z.object({
  command: z.string().trim().min(1, "Command is required."),
  safety: commandSafetySchema.default("SOFT"),
  confirmed: z.boolean().default(false),
});

export const historyCreateRequestSchema = z.object({
  query: z.string().trim().min(1, "Query is required."),
  response: z.string().trim().min(1, "Response is required."),
});

export const memoryCreateRequestSchema = z.object({
  category: z.string().trim().min(1, "Category is required."),
  content: z.string().trim().min(1, "Content is required."),
  importance: z.coerce.number().int().min(1).max(5).default(1),
});

export const skillUpsertRequestSchema = z.object({
  name: z.string().trim().min(1, "Name is required."),
  pattern: z.string().trim().min(1, "Pattern is required."),
  commands: z.union([
    z.string().trim().min(1, "Commands are required."),
    z.array(z.string().trim().min(1)).min(1, "Commands are required."),
  ]),
}).transform((value) => ({
  name: value.name,
  pattern: value.pattern,
  commands: value.commands,
}));

export const cronCreateRequestSchema = z.object({
  name: z.string().trim().min(1, "Name is required."),
  schedule: z.string().trim().min(1, "Schedule is required."),
  command: z.string().trim().min(1, "Command is required."),
});

export const aiCommandSchema = z.object({
  command: z.string().trim().min(1),
  safety: commandSafetySchema.default("SOFT"),
  explanation: z.string().default("No explanation provided."),
  risks: z.array(z.string()).optional(),
});

export const aiMemorySchema = z.object({
  category: z.string().trim().min(1),
  content: z.string().trim().min(1),
  importance: z.coerce.number().int().min(1).max(5).default(1),
});

export const aiSkillSchema = z.object({
  name: z.string().trim().min(1),
  pattern: z.string().trim().min(1),
  commands: z.union([z.string(), z.array(z.string())]),
});

export const aiChatResponseSchema = z.object({
  reply: z.string().default(""),
  commands: z.array(aiCommandSchema).default([]),
  memory: z.array(aiMemorySchema).default([]),
  skills: z.array(aiSkillSchema).default([]),
});
