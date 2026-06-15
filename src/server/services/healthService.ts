import { db } from "../db/client";
import { checkOllamaStatus } from "./ollamaClient";

export interface HealthStatus {
  status: "healthy" | "unhealthy" | "degraded";
  timestamp: string;
  checks: {
    database: {
      status: "ok" | "error";
      message?: string;
    };
    ollama: {
      status: "ok" | "error" | "not_configured";
      message?: string;
      version?: string;
    };
  };
}

export async function getHealthStatus(): Promise<HealthStatus> {
  const timestamp = new Date().toISOString();
  const checks = {
    database: await checkDatabase(),
    ollama: await checkOllama(),
  };

  // 确定整体状态
  const allOk = Object.values(checks).every(check => check.status === "ok");
  const hasError = Object.values(checks).some(check => check.status === "error");

  return {
    status: allOk ? "healthy" : hasError ? "unhealthy" : "degraded",
    timestamp,
    checks,
  };
}

async function checkDatabase(): Promise<{ status: "ok" | "error"; message?: string }> {
  try {
    // 尝试执行简单查询
    db.prepare("SELECT 1").get();
    return { status: "ok" };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Database connection failed",
    };
  }
}

async function checkOllama(): Promise<{
  status: "ok" | "error" | "not_configured";
  message?: string;
  version?: string;
}> {
  try {
    const status = await checkOllamaStatus();

    if (!status.isRunning) {
      return {
        status: "error",
        message: "Ollama service is not running",
      };
    }

    return {
      status: "ok",
      version: status.version,
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Ollama check failed",
    };
  }
}