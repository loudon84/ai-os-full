import type { EmailClientError, EmailResult } from "../types/email-result";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/** 将 axios / fetch 错误归一化为 EmailClientError */
export function normalizeEmailApiError(error: unknown): EmailClientError {
  const ax = error as {
    response?: { status?: number; data?: unknown };
    message?: string;
  };
  const status = ax.response?.status ?? 0;
  const data = ax.response?.data;
  let message = ax.message && ax.message !== "Network Error" ? ax.message : "请求失败";
  let code: string | undefined;

  if (typeof data === "string" && data.trim()) {
    message = data;
  } else if (isRecord(data)) {
    if (typeof data.message === "string" && data.message) message = data.message;
    if (typeof data.code === "string" && data.code) code = data.code;
  }

  if (status === 401) message = "未登录或会话已过期";
  if (status === 403) message = "无权限执行此操作";
  if (status === 404) message = message === "请求失败" ? "资源不存在" : message;
  if (status === 422) message = message === "请求失败" ? "请求参数无效" : message;

  return { status, message, code };
}

export async function wrapEmailRequest<T>(fn: () => Promise<T>): Promise<EmailResult<T>> {
  try {
    const data = await fn();
    return { success: true, data };
  } catch (error) {
    return { success: false, error: normalizeEmailApiError(error) };
  }
}
