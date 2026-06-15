import { Router } from "express";
import { checkOllamaStatus, listOllamaModels, getOllamaConfig } from "../services/ollamaClient";
import { logger } from "../logger";

const router = Router();

/**
 * GET /api/ollama/status
 * 检测 Ollama 服务状态
 */
router.get("/status", async (req, res) => {
  try {
    const baseUrl = req.query.baseUrl as string;
    const status = await checkOllamaStatus(baseUrl);

    // 如果检测到正在运行，同时获取配置信息
    if (status.isRunning) {
      const config = getOllamaConfig();
      const models = await listOllamaModels(baseUrl);

      res.json({
        ...status,
        currentConfig: config,
        availableModels: models,
      });
    } else {
      res.json(status);
    }
  } catch (error) {
    logger.error({ error }, "Failed to check Ollama status");
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to check Ollama status",
    });
  }
});

/**
 * GET /api/ollama/models
 * 获取已安装的模型列表
 */
router.get("/models", async (req, res) => {
  try {
    const baseUrl = req.query.baseUrl as string;
    const models = await listOllamaModels(baseUrl);
    res.json({ models });
  } catch (error) {
    logger.error({ error }, "Failed to list models");
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to list models",
    });
  }
});

/**
 * GET /api/ollama/config
 * 获取当前 Ollama 配置
 */
router.get("/config", async (_req, res) => {
  try {
    const config = getOllamaConfig();
    res.json(config);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to get config",
    });
  }
});

/**
 * POST /api/ollama/config
 * 更新 Ollama 配置（仅开发模式支持）
 *
 * 注意：这会更新环境变量，需要重启服务才能生效
 * 生产环境应通过 .env.local 文件配置
 */
router.post("/config", async (req, res) => {
  try {
    const { baseUrl, model } = req.body;

    if (!baseUrl || !model) {
      return res.status(400).json({
        error: "baseUrl and model are required",
      });
    }

    // 验证配置是否有效
    const status = await checkOllamaStatus(baseUrl);
    if (!status.isRunning) {
      return res.status(400).json({
        error: "Ollama service is not running at the specified URL",
        status,
      });
    }

    const models = await listOllamaModels(baseUrl);
    const modelExists = models.some((m) => m.name === model || m.name.startsWith(model));

    if (!modelExists) {
      return res.status(400).json({
        error: `Model "${model}" is not installed`,
        availableModels: models.map((m) => m.name),
      });
    }

    // 在开发模式下，我们可以动态更新环境变量
    // 生产环境应通过 .env.local 配置
    process.env.OLLAMA_BASE_URL = baseUrl;
    process.env.OLLAMA_MODEL = model;

    logger.info(`Ollama config updated: ${baseUrl} / ${model}`);

    res.json({
      success: true,
      config: { baseUrl, model },
      message: "Configuration updated. Restart the service to apply changes.",
    });
  } catch (error) {
    logger.error({ error }, "Failed to update config");
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to update config",
    });
  }
});

export default router;