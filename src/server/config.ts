export const config = {
  get port() {
    return Number(process.env.PORT || 3000);
  },
  get databasePath() {
    return process.env.DATABASE_PATH || "lahe.db";
  },
  get ollamaBaseUrl() {
    return process.env.OLLAMA_BASE_URL || "http://localhost:11434";
  },
  get ollamaModel() {
    return process.env.OLLAMA_MODEL || "qwen3.5:0.8b";
  },
  get nodeEnv() {
    return process.env.NODE_ENV || "development";
  },
};
