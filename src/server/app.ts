import express from "express";
import { chatRoutes } from "./routes/chatRoutes";
import { commandRoutes } from "./routes/commandRoutes";
import { cronRoutes } from "./routes/cronRoutes";
import { historyRoutes } from "./routes/historyRoutes";
import { memoryRoutes } from "./routes/memoryRoutes";
import { skillRoutes } from "./routes/skillRoutes";
import { systemRoutes } from "./routes/systemRoutes";

export function createApp() {
  const app = express();

  app.use(express.json());
  app.use("/api/chat", chatRoutes);
  app.use("/api/execute", commandRoutes);
  app.use("/api", systemRoutes);
  app.use("/api/history", historyRoutes);
  app.use("/api/memory", memoryRoutes);
  app.use("/api/skills", skillRoutes);
  app.use("/api/cron", cronRoutes);

  return app;
}

