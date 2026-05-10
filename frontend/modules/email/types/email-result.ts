/** 前端 Email API 统一结果（与后端 HTTP 状态对齐） */
export interface EmailClientError {
  status: number;
  message: string;
  code?: string;
}

export type EmailResult<T> =
  | { success: true; data: T }
  | { success: false; error: EmailClientError };
