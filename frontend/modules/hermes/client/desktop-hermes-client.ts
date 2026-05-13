/**
 * Desktop WebView：通过 `window.hermesAPI`（Electron preload）与 Main 对话，语义对齐 hermes-desktop Chat。
 */
import type { HermesClient, HermesClientSendOptions, HermesStreamCallbacks } from "./hermes-client.types";

/** 与 hermes-desktop preload 对齐的最小类型（避免依赖 submodule 路径） */
export type DesktopHermesApi = {
  sendMessage: (
    message: string,
    profile?: string,
    resumeSessionId?: string,
    history?: Array<{ role: string; content: string }>,
  ) => Promise<{ response: string; sessionId?: string }>;
  abortChat: () => Promise<void>;
  onChatChunk: (callback: (chunk: string) => void) => () => void;
  onChatDone: (callback: (sessionId?: string) => void) => () => void;
  onChatToolProgress: (callback: (tool: string) => void) => () => void;
  onChatUsage: (callback: (usage: Record<string, unknown>) => void) => () => void;
  onChatError: (callback: (error: string) => void) => () => void;
  gatewayStatus: () => Promise<boolean>;
};

function getDesktopApi(): DesktopHermesApi | null {
  if (typeof window === "undefined") return null;
  const w = window as Window & { hermesAPI?: DesktopHermesApi };
  const api = w.hermesAPI;
  if (api && typeof api.sendMessage === "function") return api;
  return null;
}

export class DesktopHermesClient implements HermesClient {
  async checkHealth(): Promise<boolean> {
    const api = getDesktopApi();
    if (!api?.gatewayStatus) return false;
    try {
      return await api.gatewayStatus();
    } catch {
      return false;
    }
  }

  send(opts: HermesClientSendOptions, callbacks: HermesStreamCallbacks): AbortController {
    const ac = new AbortController();
    const api = getDesktopApi();
    if (!api) {
      queueMicrotask(() => {
        if (!ac.signal.aborted) callbacks.onError("当前环境无 hermesAPI（非 Hermes Desktop 嵌入）");
      });
      return ac;
    }

    let doneCalled = false;
    const unsubs: Array<() => void> = [];

    if (opts.sessionId) {
      queueMicrotask(() => {
        if (!ac.signal.aborted) callbacks.onSessionEstablished?.(opts.sessionId!);
      });
    }

    const cleanup = () => {
      unsubs.forEach((u) => {
        try {
          u();
        } catch {
          /* ignore */
        }
      });
      unsubs.length = 0;
    };

    const safeOnDone = (sessionId?: string) => {
      if (doneCalled || ac.signal.aborted) return;
      doneCalled = true;
      cleanup();
      callbacks.onDone({ sessionId });
    };

    const safeOnError = (msg: string) => {
      if (doneCalled || ac.signal.aborted) return;
      doneCalled = true;
      cleanup();
      callbacks.onError(msg);
    };

    unsubs.push(
      api.onChatChunk((chunk) => {
        if (ac.signal.aborted || doneCalled) return;
        callbacks.onChunk(chunk);
      }),
    );
    unsubs.push(
      api.onChatDone((sessionId) => {
        safeOnDone(sessionId ?? opts.sessionId);
      }),
    );
    unsubs.push(
      api.onChatError((err) => {
        safeOnError(err);
      }),
    );
    unsubs.push(
      api.onChatToolProgress((tool) => {
        if (ac.signal.aborted || doneCalled) return;
        callbacks.onToolProgress?.(tool);
      }),
    );
    unsubs.push(
      api.onChatUsage((usage) => {
        if (ac.signal.aborted || doneCalled) return;
        callbacks.onUsage?.(usage as Record<string, unknown>);
      }),
    );

    ac.signal.addEventListener("abort", () => {
      if (!doneCalled) {
        doneCalled = true;
        cleanup();
        void api.abortChat();
      }
    });

    void api.sendMessage(opts.message, opts.profile, opts.sessionId, opts.history).catch((e) => {
      safeOnError(e instanceof Error ? e.message : String(e));
    });

    return ac;
  }
}
