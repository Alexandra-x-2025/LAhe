import { execaCommand } from "execa";

async function runSystemCommand(command: string, fallback = "") {
  const result = await execaCommand(command, {
    shell: true,
    timeout: 10_000,
    reject: false,
  }).catch(() => null);

  if (!result || result.exitCode !== 0) return fallback;
  return result.stdout.trim();
}

export async function getSystemStats() {
  const [uptime, memory, disk, cpuLoad] = await Promise.all([
    runSystemCommand("uptime -p", "N/A"),
    runSystemCommand("free -h"),
    runSystemCommand("df -h --total | tail -1"),
    runSystemCommand("top -bn1 | grep 'Cpu(s)'"),
  ]);

  return { uptime, memory, disk, cpuLoad };
}

export async function getJournalLogs() {
  const stdout = await runSystemCommand("journalctl -n 50 --no-hostname --output=short-iso");

  if (!stdout) {
    return [
      {
        timestamp: new Date().toISOString(),
        source: "system",
        message: "Live journalctl access failed. Running in restricted container mode.",
      },
    ];
  }

  return stdout.split("\n").map((line) => {
    const parts = line.split(" ");
    return {
      timestamp: parts[0] || "",
      source: parts[1]?.replace(":", "") || "kernel",
      message: parts.slice(2).join(" "),
    };
  });
}

