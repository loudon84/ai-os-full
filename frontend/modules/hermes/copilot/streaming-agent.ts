/**
 * Hermes Streaming Agent
 * CopilotKit AbstractAgent implementation that connects to
 * /ai/copilot SSE endpoint and emits AG-UI events.
 *
 * Each agent (finance/risk/forecast) is an instance of this class.
 */
import { AbstractAgent } from "@ag-ui/client";
import { Observable } from "rxjs";
import type { HermesAgentId } from "./types";

export class HermesStreamingAgent extends AbstractAgent {
  agentId: HermesAgentId;

  constructor(agentId: HermesAgentId) {
    super();
    this.agentId = agentId;
  }

  run(input: { messages?: Array<{ role: string; content: string }>; context?: Record<string, unknown> }): Observable<Record<string, unknown>> {
    return new Observable((subscriber) => {
      const lastUserMessage = [...(input.messages ?? [])]
        .reverse()
        .find((m) => m.role === "user");

      fetch("/ai/copilot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          agentId: this.agentId,
          sessionId: input.context?.sessionId ?? "",
          message: lastUserMessage?.content ?? "",
          context: input.context ?? {},
        }),
      })
        .then(async (response) => {
          if (!response.body) {
            subscriber.next({
              type: "RUN_ERROR",
              error: "Empty SSE response body",
            });
            subscriber.complete();
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

              let payload: Record<string, unknown>;
              try {
                payload = JSON.parse(dataText);
              } catch {
                payload = { raw: dataText };
              }

              switch (eventName) {
                case "RUN_STARTED":
                  subscriber.next({ type: "RUN_STARTED", ...payload });
                  break;
                case "TEXT_DELTA":
                  subscriber.next({
                    type: "TEXT_MESSAGE_CONTENT",
                    delta: payload.delta,
                  });
                  break;
                case "TOOL_CALL_STARTED":
                  subscriber.next({
                    type: "TOOL_CALL_STARTED",
                    ...payload,
                  });
                  break;
                case "TOOL_CALL_FINISHED":
                  subscriber.next({
                    type: "TOOL_CALL_FINISHED",
                    ...payload,
                  });
                  break;
                case "TOOL_CALL_ERROR":
                  subscriber.next({
                    type: "TOOL_CALL_ERROR",
                    ...payload,
                  });
                  break;
                case "MESSAGE":
                  subscriber.next({
                    type: "MESSAGE",
                    ...payload,
                  });
                  break;
                case "USAGE":
                  subscriber.next({
                    type: "STATE_SYNC",
                    state: { usage: payload },
                  });
                  break;
                case "RUN_FINISHED":
                  subscriber.next({ type: "RUN_FINISHED", ...payload });
                  subscriber.complete();
                  break;
                case "RUN_ERROR":
                  subscriber.next({ type: "RUN_ERROR", ...payload });
                  subscriber.complete();
                  break;
              }
            }
          }
        })
        .catch((error) => {
          subscriber.next({
            type: "RUN_ERROR",
            error: error instanceof Error ? error.message : String(error),
          });
          subscriber.complete();
        });
    });
  }

  connect(): Observable<Record<string, unknown>> {
    return this.run.bind(this) as unknown as Observable<Record<string, unknown>>;
  }

  clone() {
    return new HermesStreamingAgent(this.agentId);
  }
}
