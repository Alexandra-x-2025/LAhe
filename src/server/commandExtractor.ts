import type { AiCommand } from "./types";

const commandPrefixes = [
  "journalctl",
  "systemctl",
  "pacman",
  "yay",
  "ip",
  "ss",
  "df",
  "free",
  "top",
  "uptime",
  "lsblk",
  "dmesg",
  "cat",
  "grep",
];

function cleanCandidate(value: string) {
  return value
    .replace(/[`"'，。；;]+$/g, "")
    .replace(/\\n.*$/g, "")
    .trim();
}

export function extractCommandSuggestions(text: string): AiCommand[] {
  const commands = new Map<string, AiCommand>();
  const prefixPattern = commandPrefixes.join("|");
  const pattern = new RegExp(`(?:^|[\\s"'\\\`：:])(${prefixPattern})(?:\\s+[^\\n\\r，。；;,.\\]\\[{}<>]*)?`, "gim");

  for (const match of text.matchAll(pattern)) {
    const raw = cleanCandidate(match[0].replace(/^["'`\s：:]+/, ""));
    if (!raw || raw.length < 2) continue;

    const command = cleanCandidate(raw.split(/(?:。|，|,|\)|\]|$)/)[0].replace(/\s*[\u3400-\u9fff].*$/u, ""));
    if (!command || commands.has(command)) continue;

    commands.set(command, {
      command,
      safety: "SOFT",
      explanation: "Extracted from local model response because structured command output was missing.",
    });
  }

  return [...commands.values()].slice(0, 5);
}
