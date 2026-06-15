import express from "express";
import { chatRoutes } from "./routes/chatRoutes";
import { commandRoutes } from "./routes/commandRoutes";
import { cronRoutes } from "./routes/cronRoutes";
import { historyRoutes } from "./routes/historyRoutes";
import { memoryRoutes } from "./routes/memoryRoutes";
import { skillRoutes } from "./routes/skillRoutes";
import { systemRoutes } from "./routes/systemRoutes";
import ollamaRoutes from "./routes/ollamaRoutes";
import settingsRoutes from "./routes/settingsRoutes";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";

export function createApp() {
  const app = express();

  // JSON 解析
  app.use(express.json());

  // API 路由
  app.use("/api/chat", chatRoutes);
  app.use("/api/execute", commandRoutes);
  app.use("/api", systemRoutes);
  app.use("/api/history", historyRoutes);
  app.use("/api/memory", memoryRoutes);
  app.use("/api/skills", skillRoutes);
  app.use("/api/cron", cronRoutes);
  app.use("/api/ollama", ollamaRoutes);
  app.use("/api/settings", settingsRoutes);

  // 404 处理
  app.use(notFoundHandler);

  // 错误处理（必须在所有路由之后）
  app.use(errorHandler);

  return app;
}

