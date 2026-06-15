import { config } from "../config";

export interface OllamaMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface OllamaModel {
  name: string;
  modified_at: string;
  size: number;
  digest: string;
  details: {
    format: string;
    family: string;
    families: string[];
    parameter_size: string;
    quantization_level: string;
  };
}

export interface OllamaStatus {
  isRunning: boolean;
  baseUrl: string;
  version?: string;
  error?: string;
}

export interface OllamaConfig {
  baseUrl: string;
  model: string;
}

// 检测 Ollama 服务是否运行
export async function checkOllamaStatus(baseUrl?: string): Promise<OllamaStatus> {
  const targetUrl = baseUrl || config.ollamaBaseUrl;

  try {
    const response = await fetch(`${targetUrl}/api/tags`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(3000), // 3秒超时
    });

    if (!response.ok) {
      throw new Error(`Ollama returned ${response.status}`);
    }

    // 尝试获取版本信息
    let version: string | undefined;
    try {
      const versionRes = await fetch(`${targetUrl}/api/version`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(3000),
      });
      if (versionRes.ok) {
        const versionData = await versionRes.json();
        version = versionData.version;
      }
    } catch {
      // 版本信息获取失败不影响状态检测
    }

    return {
      isRunning: true,
      baseUrl: targetUrl,
      version,
    };
  } catch (error) {
    return {
      isRunning: false,
      baseUrl: targetUrl,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// 获取已安装的模型列表
export async function listOllamaModels(baseUrl?: string): Promise<OllamaModel[]> {
  const targetUrl = baseUrl || config.ollamaBaseUrl;

  try {
    const response = await fetch(`${targetUrl}/api/tags`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      throw new Error(`Ollama returned ${response.status}`);
    }

    const data = await response.json();
    return data.models || [];
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : String(error));
  }
}

// 获取当前配置
export function getOllamaConfig(): OllamaConfig {
  return {
    baseUrl: config.ollamaBaseUrl,
    model: config.ollamaModel,
  };
}

export async function chatWithOllama(messages: OllamaMessage[]) {
  const response = await fetch(`${config.ollamaBaseUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: config.ollamaModel,
      messages,
      stream: false,
      format: "json",
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Local model request failed: ${response.status} ${errorText}`);
  }

  const data: any = await response.json();
  return data?.message?.content || "";
}

