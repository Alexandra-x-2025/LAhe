import { Router } from "express";
import { getHealthStatus } from "../services/healthService";

const router = Router();

/**
 * GET /health
 * 健康检查端点
 *
 * 返回服务、数据库和 Ollama 的状态
 */
router.get("/", async (_req, res) => {
  const health = await getHealthStatus();

  const statusCode = health.status === "healthy" ? 200 : 503;

  res.status(statusCode).json(health);
});

/**
 * GET /health/ready
 * 就绪检查（Kubernetes 风格）
 */
router.get("/ready", async (_req, res) => {
  const health = await getHealthStatus();

  if (health.status === "healthy") {
    res.status(200).json({ ready: true });
  } else {
    res.status(503).json({ ready: false, checks: health.checks });
  }
});

/**
 * GET /health/live
 * 存活检查（Kubernetes 风格）
 * 只检查服务是否响应，不检查依赖
 */
router.get("/live", (_req, res) => {
  res.status(200).json({ alive: true });
});

export default router;