// 环境变量（默认值）
let _ollamaBaseUrl = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
let _ollamaModel = process.env.OLLAMA_MODEL || "qwen3.5:0.8b";

/**
 * 从数据库加载设置并更新配置
 * 在数据库初始化后调用
 */
export async function loadSettingsFromDatabase() {
  try {
    const { getSettingOrDefault } = await import("./db/repositories/settingsRepository");

    const dbBaseUrl = getSettingOrDefault("ollama.baseUrl", _ollamaBaseUrl);
    const dbModel = getSettingOrDefault("ollama.model", _ollamaModel);

    // 如果数据库中有值，更新配置
    if (dbBaseUrl) _ollamaBaseUrl = dbBaseUrl;
    if (dbModel) _ollamaModel = dbModel;

    console.log(`[Config] Loaded from database: ${dbBaseUrl} / ${dbModel}`);
  } catch (error) {
    console.warn("[Config] Failed to load settings from database:", error);
  }
}

/**
 * 动态更新配置（例如通过 API）
 */
export function updateOllamaConfig(baseUrl: string, model: string) {
  _ollamaBaseUrl = baseUrl;
  _ollamaModel = model;
}

export const config = {
  get port() {
    return Number(process.env.PORT || 3000);
  },
  get databasePath() {
    return process.env.DATABASE_PATH || "lahe.db";
  },
  get ollamaBaseUrl() {
    return _ollamaBaseUrl;
  },
  get ollamaModel() {
    return _ollamaModel;
  },
  get nodeEnv() {
    return process.env.NODE_ENV || "development";
  },
};