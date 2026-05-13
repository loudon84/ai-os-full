/**
 * HermesClient — 统一 Web（BFF SSE）与 Desktop（hermesAPI IPC）对话出口。
 */

export interface HermesClientSendOptions {
  message: string;
  sessionId?: string;
  profile?: string;
  history?: Array<{ role: string; content: string }>;
}

export interface HermesStreamCallbacks {
  /** Web：在 `session/new` 或复用已有 id 之后、`chat/start` 之前调用，便于立刻绑定业务键，避免用户未等到流结束就离开导致丢会话 */
  onSessionEstablished?: (sessionId: string) => void;
  onChunk: (text: string) => void;
  onToolProgress?: (toolName: string, preview?: string) => void;
  onUsage?: (usage: Record<string, unknown>) => void;
  onDone: (result?: { sessionId?: string }) => void;
  onError: (error: string) => void;
}

export interface HermesClient {
  /**
   * 发起一轮对话；返回 AbortController，abort() 可取消进行中请求。
   */
  send(opts: HermesClientSendOptions, callbacks: HermesStreamCallbacks): AbortController;
  checkHealth(): Promise<boolean>;
}

/** 面板消息（与 Runtime 会话模型解耦） */
export type HermesPanelMessage = {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  isStreaming?: boolean;
};
