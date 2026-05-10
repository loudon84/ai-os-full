import type { z } from "zod";

/** AG-UI：sandbox ↔ CopilotKit 事件载荷（扩展字段仅在 payload 中携带） */
export type AGUIEventContext = {
  task_id?: string;
};

export type AGUIEvent = {
  type: string;
  payload: Record<string, unknown>;
  context: AGUIEventContext;
  /** 本地日志记录时间戳（毫秒），不参与 AG-UI 协议传输时可省略 */
  ts?: number;
};

export type SandboxRuntimeState = "idle" | "loading" | "rendering" | "error";

export type RegisteredGenerativeComponentMeta = {
  name: string;
  schema: z.ZodTypeAny;
  /** 可选：供 iframe srcDoc 执行的纯 JS（React.createElement），无则仅用宿主内渲染 */
  sandboxSource?: string;
};

export type ComponentRegistrationPayload = {
  name: string;
  schema: z.ZodTypeAny;
  sandboxSource?: string;
};
