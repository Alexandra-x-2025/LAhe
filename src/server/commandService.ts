import { execaCommand } from "execa";
import { evaluateCommandExecution } from "./commandSafety";
import type { CommandSafety } from "./types";

export async function executeCommand(input: {
  command: string;
  safety: CommandSafety;
  confirmed: boolean;
}) {
  const evaluation = evaluateCommandExecution({
    command: input.command,
    claimedSafety: input.safety,
    confirmed: input.confirmed,
  });

  if (!evaluation.allowed) {
    return { blocked: true, safety: evaluation.safety, error: evaluation.reason };
  }

  try {
    const result = await execaCommand(input.command, {
      shell: true,
      timeout: 20_000,
      reject: false,
    });

    if (result.exitCode !== 0) {
      return {
        blocked: false,
        safety: evaluation.safety,
        stdout: result.stdout,
        stderr: result.stderr,
        error: result.stderr || `Command exited with code ${result.exitCode}.`,
        exitCode: result.exitCode,
      };
    }

    return {
      blocked: false,
      safety: evaluation.safety,
      stdout: result.stdout,
      stderr: result.stderr,
      exitCode: result.exitCode,
    };
  } catch (error: any) {
    return {
      blocked: false,
      safety: evaluation.safety,
      stdout: error.stdout || "",
      stderr: error.stderr || "",
      error: error.message,
    };
  }
}

