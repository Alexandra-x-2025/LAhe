/**
 * 统一的 API 错误处理
 */

export interface ApiError {
  error: string;
  stack?: string;
}

export interface ApiResponse<T = any> {
  success?: boolean;
  data?: T;
  error?: string;
}

/**
 * API 请求封装，统一错误处理
 */
export async function apiRequest<T = any>(
  url: string,
  options?: RequestInit
): Promise<T> {
  try {
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      ...options,
    });

    // 处理 404
    if (response.status === 404) {
      throw new Error("API endpoint not found");
    }

    // 处理非 2xx 响应
    if (!response.ok) {
      let errorData: ApiError | null = null;
      try {
        errorData = await response.json();
      } catch {
        // JSON 解析失败，使用状态文本
      }
      throw new Error(errorData?.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("An unknown error occurred");
  }
}

/**
 * GET 请求
 */
export async function get<T = any>(url: string): Promise<T> {
  return apiRequest<T>(url, { method: "GET" });
}

/**
 * POST 请求
 */
export async function post<T = any>(url: string, body?: any): Promise<T> {
  return apiRequest<T>(url, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/**
 * PUT 请求
 */
export async function put<T = any>(url: string, body?: any): Promise<T> {
  return apiRequest<T>(url, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

/**
 * DELETE 请求
 */
export async function del<T = any>(url: string): Promise<T> {
  return apiRequest<T>(url, { method: "DELETE" });
}