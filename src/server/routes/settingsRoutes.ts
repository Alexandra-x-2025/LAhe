import { Router } from "express";
import { getSetting, getSettingsByCategory, upsertSetting, deleteSetting } from "../db/repositories/settingsRepository";
import { logger } from "../logger";

const router = Router();

/**
 * GET /api/settings
 * 获取所有设置
 */
router.get("/", async (_req, res) => {
  try {
    const settings = getSettingsByCategory("general");
    const settingsMap = settings.reduce((acc, s) => {
      acc[s.key] = s.value;
      return acc;
    }, {} as Record<string, string>);

    res.json(settingsMap);
  } catch (error) {
    logger.error({ error }, "Failed to fetch settings");
    res.status(500).json({ error: "Failed to fetch settings" });
  }
});

/**
 * GET /api/settings/:key
 * 获取单个设置值
 */
router.get("/:key", async (req, res) => {
  try {
    const { key } = req.params;
    const value = getSetting(key);

    if (value === null) {
      return res.status(404).json({ error: "Setting not found" });
    }

    res.json({ key, value });
  } catch (error) {
    logger.error({ error }, "Failed to fetch setting");
    res.status(500).json({ error: "Failed to fetch setting" });
  }
});

/**
 * POST /api/settings
 * 保存单个设置
 */
router.post("/", async (req, res) => {
  try {
    const { key, value } = req.body;

    if (!key || value === undefined) {
      return res.status(400).json({ error: "key and value are required" });
    }

    const setting = upsertSetting(key, String(value), "general");
    logger.info({ key, value }, "Setting saved");

    res.json({
      key: setting.key,
      value: setting.value,
      updated_at: setting.updated_at,
    });
  } catch (error) {
    logger.error({ error }, "Failed to save setting");
    res.status(500).json({ error: "Failed to save setting" });
  }
});

/**
 * PUT /api/settings/:key
 * 更新单个设置
 */
router.put("/:key", async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;

    if (value === undefined) {
      return res.status(400).json({ error: "value is required" });
    }

    const setting = upsertSetting(key, String(value), "general");
    logger.info({ key, value }, "Setting updated");

    res.json({
      key: setting.key,
      value: setting.value,
      updated_at: setting.updated_at,
    });
  } catch (error) {
    logger.error({ error }, "Failed to update setting");
    res.status(500).json({ error: "Failed to update setting" });
  }
});

/**
 * DELETE /api/settings/:key
 * 删除设置
 */
router.delete("/:key", async (req, res) => {
  try {
    const { key } = req.params;

    // 保护关键设置不被删除
    const protectedKeys = ["ollama.baseUrl", "ollama.model"];
    if (protectedKeys.includes(key)) {
      return res.status(403).json({ error: "This setting cannot be deleted" });
    }

    const deleted = deleteSetting(key);

    if (!deleted) {
      return res.status(404).json({ error: "Setting not found" });
    }

    logger.info({ key }, "Setting deleted");
    res.json({ message: "Setting deleted" });
  } catch (error) {
    logger.error({ error }, "Failed to delete setting");
    res.status(500).json({ error: "Failed to delete setting" });
  }
});

export default router;