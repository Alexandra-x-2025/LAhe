import type { CommandSafety } from "./types";

export function inferCommandSafety(command: string): CommandSafety {
  const normalized = command.trim().toLowerCase();
  const criticalPatterns = [
    /\brm\s+.*(-r|-rf|--recursive)/,
    /\bmkfs(\.|\/|\s)/,
    /\bdd\s+/,
    /\bshutdown\b/,
    /\breboot\b/,
    /\bpoweroff\b/,
    /\bhalt\b/,
    />\s*\/dev\/sd[a-z]/,
    />\s*\/dev\/nvme\d+n\d+/,
    /\bchmod\s+(-r\s+)?777\s+\//,
    /\bchown\s+(-r\s+)?.+\s+\//,
    /\bmount\s+.*\/etc\/fstab/,
  ];
  if (criticalPatterns.some((pattern) => pattern.test(normalized))) return "CRITICAL";

  const moderatePatterns = [
    /\bsudo\b/,
    /\bpacman\s+(-s|--sync|--remove|-r)\b/i,
    /\byay\s+(-s|--sync|--remove|-r)\b/i,
    /\bsystemctl\s+(start|stop|restart|enable|disable|mask|unmask)\b/,
    /\bjournalctl\b.*(--vacuum|--rotate)/,
    /\bcp\s+.*\s+\/etc\//,
    /\bmv\s+.*\s+\/etc\//,
    /\bsed\s+.*-i\b/,
  ];
  if (moderatePatterns.some((pattern) => pattern.test(normalized))) return "MODERATE";

  return "SOFT";
}

export function maxSafety(a: CommandSafety, b: CommandSafety): CommandSafety {
  const rank: Record<CommandSafety, number> = { SOFT: 0, MODERATE: 1, CRITICAL: 2 };
  return rank[a] >= rank[b] ? a : b;
}

export function evaluateCommandExecution(input: {
  command: string;
  claimedSafety: CommandSafety;
  confirmed: boolean;
}) {
  const inferredSafety = inferCommandSafety(input.command);
  const safety = maxSafety(input.claimedSafety, inferredSafety);

  if (safety === "CRITICAL") {
    return {
      allowed: false,
      safety,
      reason: "Command was blocked by the local safety gate because it is classified as CRITICAL.",
    };
  }

  if (safety === "MODERATE" && !input.confirmed) {
    return {
      allowed: false,
      safety,
      reason: "Command requires explicit confirmation before execution.",
    };
  }

  return { allowed: true, safety };
}

