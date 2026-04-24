export enum CommandSafety {
  SOFT = "SOFT", // Safe for everyone (read-only, search)
  MODERATE = "MODERATE", // Requires confirmation (install, service start)
  CRITICAL = "CRITICAL", // Highly dangerous (rm, mkfs, dd)
}

export interface ArchCommand {
  command: string;
  explanation: string;
  safety: CommandSafety;
  risks?: string[];
}

export interface Interaction {
  id: number;
  query: string;
  response: string;
  timestamp: string;
}

export interface LogEntry {
  timestamp: string;
  source: string;
  message: string;
}

export interface Skill {
  id: number;
  name: string;
  pattern: string;
  commands: string;
  efficacy: number;
  timestamp: string;
}

export interface MemoryItem {
  id: number;
  category: string;
  content: string;
  importance: number;
  timestamp: string;
}

export interface CronJob {
  id: number;
  name: string;
  schedule: string;
  command: string;
  last_run: string | null;
  status: "active" | "disabled";
}
