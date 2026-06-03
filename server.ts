import "./src/server/loadEnv";
import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { config } from "./src/server/config";
import { initializeSchema } from "./src/server/db/schema";
import { logger } from "./src/server/logger";
import { createApp } from "./src/server/app";

async function startServer() {
  initializeSchema();

  const app = createApp();

  if (config.nodeEnv !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(config.port, "0.0.0.0", () => {
    logger.info(`Arch Assistant Server running at http://localhost:${config.port}`);
  });
}

startServer();
