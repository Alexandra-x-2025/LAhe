import { config } from "../config";

export interface OllamaMessage {
  role: "system" | "user" | "assistant";
  content: string;
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

