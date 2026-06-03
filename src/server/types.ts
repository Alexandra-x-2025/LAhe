export type CommandSafety = "SOFT" | "MODERATE" | "CRITICAL";

export interface ChatMessage {
  role: "user" | "ai";
  content: string;
}

export interface AiCommand {
  command: string;
  safety: CommandSafety;
  explanation: string;
  risks?: string[];
}

export interface AiMemory {
  category: string;
  content: string;
  importance?: number;
}

export interface AiSkill {
  name: string;
  pattern: string;
  commands: string | string[];
}

export interface AiChatResponse {
  reply: string;
  commands: AiCommand[];
  memory: AiMemory[];
  skills: AiSkill[];
}

