/**
 * Web 环境：经 Portal BFF `/api/hermes/runtime/*` 连接 hermes-webui（与 use-runtime-sse 同路径）。
 */
import type { HermesClient, HermesClientSendOptions, HermesStreamCallbacks } from "./hermes-client.types";

type StartResponse = {
  stream_id: string;
  effective_model?: string;
};

function safeJsonParse<T>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/** 供面板首轮发消息前预建会话（如注入 email workspace） */
export async function createHermesRuntimeSession(): Promise<string> {
  const res = await fetch("/api/hermes/runtime/session/new", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
    cache: "no-store",
    credentials: "same-origin",
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`session/new failed: ${res.status} ${t}`);
  }
  const data = (await res.json()) as { session?: { session_id?: string } };
  const id = data.session?.session_id;
  if (!id) throw new Error("session/new: missing session_id");
  return id;
}

export class WebHermesClient implements HermesClient {
  async checkHealth(): Promise<boolean> {
    try {
      const res = await fetch("/api/hermes/health", {
        method: "GET",
        cache: "no-store",
        credentials: "same-origin",
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  send(opts: HermesClientSendOptions, callbacks: HermesStreamCallbacks): AbortController {
    const ac = new AbortController();
    let streamId: string | null = null;
    let source: EventSource | null = null;
    let doneCalled = false;

    const finish = () => {
      try {
        source?.close();
      } catch {
        /* ignore */
      }
      source = null;
    };

    const safeOnDone = (sessionId?: string) => {
      if (doneCalled || ac.signal.aborted) return;
      doneCalled = true;
      finish();
      callbacks.onDone({ sessionId });
    };

    const safeOnError = (msg: string) => {
      if (doneCalled || ac.signal.aborted) return;
      doneCalled = true;
      finish();
      callbacks.onError(msg);
    };

    const cancelStream = async () => {
      if (streamId) {
        await fetch(
          `/api/hermes/runtime/chat/cancel?stream_id=${encodeURIComponent(streamId)}`,
          { method: "GET", cache: "no-store", credentials: "same-origin" },
        ).catch(() => {});
      }
      finish();
    };

    ac.signal.addEventListener("abort", () => {
      void cancelStream();
    });

    void (async () => {
      try {
        let sessionId = opts.sessionId;
        if (!sessionId) {
          sessionId = await createHermesRuntimeSession();
        }

        if (ac.signal.aborted) return;

        callbacks.onSessionEstablished?.(sessionId);

        const res = await fetch("/api/hermes/runtime/chat/start", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({
            session_id: sessionId,
            message: opts.message,
            attachments: undefined,
          }),
        });

        if (ac.signal.aborted) return;

        if (!res.ok) {
          const t = await res.text().catch(() => "");
          safeOnError(`chat/start failed: ${res.status} ${t}`);
          return;
        }

        const data = (await res.json()) as StartResponse;
        const sid = data.stream_id;
        if (!sid) {
          safeOnError("chat/start: missing stream_id");
          return;
        }
        streamId = sid;

        if (ac.signal.aborted) {
          await cancelStream();
          return;
        }

        const url = new URL(
          `/api/hermes/runtime/chat/stream?stream_id=${encodeURIComponent(sid)}`,
          window.location.origin,
        );
        const es = new EventSource(url.toString(), { withCredentials: true });
        source = es;

        es.addEventListener("token", (e) => {
          const payload = safeJsonParse<{ text?: string }>((e as MessageEvent).data);
          if (!payload?.text || ac.signal.aborted) return;
          callbacks.onChunk(payload.text);
        });

        es.addEventListener("tool", (e) => {
          const payload = safeJsonParse<Record<string, unknown>>((e as MessageEvent).data) ?? {};
          const name = String(payload.name ?? "");
          if (!name || ac.signal.aborted) return;
          callbacks.onToolProgress?.(name, String(payload.preview ?? ""));
        });

        es.addEventListener("done", (e) => {
          const payload = safeJsonParse<{
            session?: { session_id?: string; messages?: unknown };
          }>((e as MessageEvent).data);
          const sidOut =
            payload?.session && typeof payload.session === "object" && "session_id" in payload.session
              ? String((payload.session as { session_id?: string }).session_id ?? "")
              : undefined;
          safeOnDone(sidOut || sessionId);
        });

        es.addEventListener("apperror", (e) => {
          const payload = safeJsonParse<{ message?: string }>((e as MessageEvent).data) ?? {};
          safeOnError(payload.message ?? "Unknown error");
        });

        es.addEventListener("cancel", () => {
          safeOnDone(sessionId);
        });

        es.addEventListener("error", () => {
          if (doneCalled || ac.signal.aborted) return;
          safeOnError("SSE 连接中断");
        });
      } catch (err) {
        if (ac.signal.aborted) return;
        safeOnError(err instanceof Error ? err.message : String(err));
      }
    })();

    return ac;
  }
}
