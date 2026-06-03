import { Router } from "express";
import { executeCommand } from "../commandService";
import { createCommandExecution, listRecentCommandExecutions } from "../db/repositories/commandExecutionRepository";
import { logger } from "../logger";
import { executeRequestSchema } from "../schemas";

export const commandRoutes = Router();

commandRoutes.get("/", (req, res) => {
  res.json(listRecentCommandExecutions(50));
});

commandRoutes.post("/", async (req, res) => {
  const request = executeRequestSchema.safeParse(req.body);

  if (!request.success) {
    return res.status(400).json({ error: request.error.issues[0]?.message || "Invalid execute request." });
  }

  const { command, safety, confirmed } = request.data;
  const result = await executeCommand({ command, safety, confirmed });

  if (result.blocked) {
    createCommandExecution({
      command,
      safety: result.safety,
      confirmed,
      blocked: true,
      error: result.error,
    });
    logger.warn({ command, safety: result.safety, error: result.error }, "Command blocked by safety gate");
    return res.status(403).json({ error: result.error, safety: result.safety });
  }

  if (result.error) {
    createCommandExecution({
      command,
      safety: result.safety,
      confirmed,
      blocked: false,
      stdout: result.stdout,
      stderr: result.stderr,
      error: result.error,
      exitCode: result.exitCode,
    });
    logger.warn({ command, safety: result.safety, exitCode: result.exitCode, error: result.error }, "Command execution failed");
    return res.status(500).json(result);
  }

  createCommandExecution({
    command,
    safety: result.safety,
    confirmed,
    blocked: false,
    stdout: result.stdout,
    stderr: result.stderr,
    exitCode: result.exitCode,
  });
  logger.info({ command, safety: result.safety, exitCode: result.exitCode }, "Command executed");
  res.json(result);
});
