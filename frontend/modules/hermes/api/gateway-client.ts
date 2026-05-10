/**
 * Gateway Client
 * Client-side utility for connecting to Hermes Gateway SSE streams.
 * Used by the streaming agent and for direct SSE consumption.
 */

const GATEWAY_BASE_URL = process.env.NEXT_PUBLIC_HERMES_GATEWAY_URL ?? "";

export type GatewaySseOptions = {
  agentId: string;
  sessionId: string;
  message: string;
  context?: Record<string, unknown>;
  onEvent: (eventName: string, data: unknown) => void;
  onError: (error: string) => void;
  onComplete: () => void;
};

/**
 * Connect to the /ai/copilot SSE endpoint and consume events.
 * Returns an abort controller for cancellation.
 */
export function connectGatewaySse(options: GatewaySseOptions): AbortController {
  const controller = new AbortController();

  fetch("/ai/copilot", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      agentId: options.agentId,
      sessionId: options.sessionId,
      message: options.message,
      context: options.context,
    }),
    signal: controller.signal,
  })
    .then(async (response) => {
      if (!response.body) {
        options.onError("Empty response body");
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const chunks = buffer.split("\n\n");
        buffer = chunks.pop() ?? "";

        for (const chunk of chunks) {
          const lines = chunk.split("\n");
          let eventName = "";
          let dataText = "";

          for (const line of lines) {
            if (line.startsWith("event:")) eventName = line.slice(6).trim();
            if (line.startsWith("data:")) dataText += line.slice(5).trim();
          }

          if (!dataText) continue;

          let payload: unknown;
          try {
            payload = JSON.parse(dataText);
          } catch {
            payload = { raw: dataText };
          }

          options.onEvent(eventName, payload);
        }
      }

      options.onComplete();
    })
    .catch((err) => {
      if (err.name !== "AbortError") {
        options.onError(err instanceof Error ? err.message : String(err));
      }
    });

  return controller;
}
