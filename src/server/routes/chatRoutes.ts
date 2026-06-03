import { Router } from "express";
import { config } from "../config";
import { logger } from "../logger";
import { chatRequestSchema } from "../schemas";
import { createChatResponse } from "../services/aiService";

export const chatRoutes = Router();

chatRoutes.post("/", async (req, res) => {
  const request = chatRequestSchema.safeParse(req.body);

  if (!request.success) {
    return res.status(400).json({ error: request.error.issues[0]?.message || "Invalid chat request." });
  }

  const { message, messages } = request.data;

  try {
    res.json(await createChatResponse({ message, messages }));
  } catch (error: any) {
    logger.error({ error }, "Failed to communicate with local model");
    res.status(502).json({
      error: `Failed to communicate with local model. Ensure Ollama is running at ${config.ollamaBaseUrl} and model "${config.ollamaModel}" is installed.`,
      details: error.message,
    });
  }
});

