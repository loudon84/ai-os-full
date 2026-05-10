/**
 * Hermes Gateway Streaming Agent (server-side)
 *
 * Implements an AG-UI compatible agent for CopilotKit Runtime.
 *
 * Dual-stack connection strategy (see docs/conventions/copilotkit.md):
 *   1. Try Hermes native agent SSE (POST <base>[/v1]<gatewayPath>/sessions/<sessionId>/stream)
 *   2. On 404, fall back to OpenAI-compatible streaming (POST <base>/v1/chat/completions)
 *
 * All outgoing events MUST conform to @ag-ui/core schemas, which are validated
 * by CopilotKit Runtime via `verifyEvents`. Field name mismatches cause the
 * entire pipeline to be rejected and no messages will render in the UI.
 */
import { AbstractAgent } from "@ag-ui/client";
import type { BaseEvent, RunAgentInput } from "@ag-ui/core";
import { EventType } from "@ag-ui/core";
import { Observable } from "rxjs";
import type { HermesAgentId } from "./types";
import { HERMES_AGENT_ROUTES } from "./agent-router";

type HermesGatewayEnv = {
  baseUrl: string;
  token: string;
};

type HermesOpenAiEnv = {
  baseUrl: string;
  apiKey: string;
  model: string;
};

function normalizeGatewayBaseUrl(raw: string): string {
  return raw.trim().replace(/\/+$/, "");
}

function getHermesGatewayEnv(): HermesGatewayEnv {
  const baseUrlRaw =
    process.env.HERMES_GATEWAY_BASE_URL ??
    process.env.HERMES_BASE_URL ??
    "http://192.168.0.118:8642";

  const token =
    process.env.HERMES_GATEWAY_TOKEN ??
    process.env.HERMES_GATEWAY_API_KEY ??
    process.env.HERMES_API_KEY ??
    "change-me-local-dev";

  return {
    baseUrl: normalizeGatewayBaseUrl(baseUrlRaw),
    token,
  };
}

function normalizeOpenAiBaseUrl(raw: string): string {
  const trimmed = raw.trim().replace(/\/+$/, "");
  return trimmed.endsWith("/v1") ? trimmed : `${trimmed}/v1`;
}

function getHermesOpenAiEnv(): HermesOpenAiEnv {
  const baseUrlRaw =
    process.env.HERMES_BASE_URL ??
    process.env.HERMES_GATEWAY_BASE_URL ??
    "http://192.168.0.118:8642/v1";

  const apiKey =
    process.env.HERMES_API_KEY ??
    process.env.HERMES_GATEWAY_TOKEN ??
    process.env.HERMES_GATEWAY_API_KEY ??
    "change-me-local-dev";

  const model = process.env.HERMES_MODEL ?? "default";

  return {
    baseUrl: normalizeOpenAiBaseUrl(baseUrlRaw),
    apiKey,
    model,
  };
}

export class HermesGatewayStreamingAgent extends AbstractAgent {
  agentId: HermesAgentId;

  constructor(agentId: HermesAgentId) {
    super();
    this.agentId = agentId;
  }

  run(input: RunAgentInput): Observable<BaseEvent> {
    return new Observable<BaseEvent>((subscriber) => {
      const { baseUrl, token } = getHermesGatewayEnv();
      const route = HERMES_AGENT_ROUTES[this.agentId];

      // threadId / runId are populated by CopilotKit Runtime via prepareRunAgentInput.
      // Both are REQUIRED fields on RUN_STARTED / RUN_FINISHED per @ag-ui/core schema.
      const threadId = input.threadId;
      const runId = input.runId;

      const messages = (input.messages ?? []) as Array<{
        role: string;
        content?: string;
      }>;

      const lastUserMessage = [...messages]
        .reverse()
        .find((m) => m.role === "user");

      // Internal sessionId is used only for the gateway routing layer;
      // it is NOT an AG-UI event field.
      const sessionCtx =
        (input as unknown as { context?: Record<string, unknown> }).context ??
        {};
      const sessionId =
        (typeof sessionCtx.sessionId === "string" && sessionCtx.sessionId) ||
        `${route.defaultSessionPrefix}-${threadId}`;

      const dashboardContext =
        (sessionCtx.dashboardContext as Record<string, unknown> | undefined) ??
        {};

      const interrupt =
        (sessionCtx.interrupt as
          | { resumeToken?: string; resumePayload?: unknown }
          | undefined) ?? undefined;

      const gatewayBody = {
        message: lastUserMessage?.content ?? "",
        context: {
          ...sessionCtx,
          systemContextTag: route.systemContextTag,
          agentId: route.agentId,
          dashboardContext,
          toolsets: (dashboardContext as { toolsets?: unknown }).toolsets ?? [],
          interrupt: interrupt?.resumeToken
            ? {
                resumeToken: interrupt.resumeToken,
                resumePayload: interrupt.resumePayload ?? {},
              }
            : undefined,
        },
      };

      const base = baseUrl.replace(/\/+$/, "");
      const primaryUrl = `${base}${route.gatewayPath}/sessions/${sessionId}/stream`;
      const fallbackUrl = base.endsWith("/v1")
        ? `${base.slice(0, -3)}${route.gatewayPath}/sessions/${sessionId}/stream`
        : `${base}/v1${route.gatewayPath}/sessions/${sessionId}/stream`;

      const doFetch = (url: string) =>
        fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(gatewayBody),
        });

      const emitRunStarted = () => {
        subscriber.next({
          type: EventType.RUN_STARTED,
          threadId,
          runId,
        } as BaseEvent);
      };

      const emitRunFinished = () => {
        subscriber.next({
          type: EventType.RUN_FINISHED,
          threadId,
          runId,
        } as BaseEvent);
      };

      const emitRunError = (message: string) => {
        subscriber.next({
          type: EventType.RUN_ERROR,
          message,
        } as BaseEvent);
      };

      const runViaOpenAiStream = async () => {
        const { baseUrl: openAiBaseUrl, apiKey, model } = getHermesOpenAiEnv();
        const messageId = crypto.randomUUID();
        let textMessageStarted = false;

        emitRunStarted();

        const openAiMessages = [
          {
            role: "system" as const,
            content: `systemContextTag=${route.systemContextTag}; agentId=${route.agentId}`,
          },
          ...messages.map((m) => ({
            role: m.role,
            content: m.content ?? "",
          })),
        ];

        let response: Response;
        try {
          response = await fetch(`${openAiBaseUrl}/chat/completions`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model,
              stream: true,
              messages: openAiMessages,
            }),
          });
        } catch (err) {
          emitRunError(
            `Gateway(OpenAI) network error: ${
              err instanceof Error ? err.message : String(err)
            }`,
          );
          subscriber.complete();
          return;
        }

        if (!response.ok || !response.body) {
          const text = await response.text().catch(() => "");
          emitRunError(`Gateway(OpenAI) error: ${response.status} ${text}`);
          subscriber.complete();
          return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        const finishTextMessage = () => {
          if (textMessageStarted) {
            subscriber.next({
              type: EventType.TEXT_MESSAGE_END,
              messageId,
            } as BaseEvent);
            textMessageStarted = false;
          }
        };

        // eslint-disable-next-line no-constant-condition
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const chunks = buffer.split("\n\n");
          buffer = chunks.pop() ?? "";

          for (const chunk of chunks) {
            const lines = chunk.split("\n").map((l) => l.trim());
            for (const line of lines) {
              if (!line.startsWith("data:")) continue;
              const data = line.slice(5).trim();
              if (!data) continue;
              if (data === "[DONE]") {
                finishTextMessage();
                emitRunFinished();
                subscriber.complete();
                return;
              }

              try {
                const parsed = JSON.parse(data) as {
                  choices?: Array<{
                    delta?: { content?: string };
                    message?: { content?: string };
                  }>;
                };
                const delta: string | undefined =
                  parsed.choices?.[0]?.delta?.content ??
                  parsed.choices?.[0]?.message?.content;

                if (delta) {
                  if (!textMessageStarted) {
                    textMessageStarted = true;
                    subscriber.next({
                      type: EventType.TEXT_MESSAGE_START,
                      messageId,
                      role: "assistant",
                    } as BaseEvent);
                  }
                  subscriber.next({
                    type: EventType.TEXT_MESSAGE_CONTENT,
                    messageId,
                    delta,
                  } as BaseEvent);
                }
              } catch {
                // ignore malformed SSE line
              }
            }
          }
        }

        finishTextMessage();
        emitRunFinished();
        subscriber.complete();
      };

      const runViaGatewaySSE = async (response: Response) => {
        if (!response.ok || !response.body) {
          const text = await response.text().catch(() => "");
          emitRunError(`Gateway error: ${response.status} ${text}`);
          subscriber.complete();
          return;
        }

        emitRunStarted();

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let currentMessageId: string | null = null;

        const startTextIfNeeded = () => {
          if (!currentMessageId) {
            currentMessageId = crypto.randomUUID();
            subscriber.next({
              type: EventType.TEXT_MESSAGE_START,
              messageId: currentMessageId,
              role: "assistant",
            } as BaseEvent);
          }
          return currentMessageId;
        };

        const endTextIfNeeded = () => {
          if (currentMessageId) {
            subscriber.next({
              type: EventType.TEXT_MESSAGE_END,
              messageId: currentMessageId,
            } as BaseEvent);
            currentMessageId = null;
          }
        };

        // eslint-disable-next-line no-constant-condition
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
              payload = JSON.parse(dataText) as Record<string, unknown>;
            } catch {
              payload = { raw: dataText };
            }

            switch (eventName) {
              case "TEXT_DELTA": {
                const delta = String(payload.delta ?? "");
                if (delta) {
                  const mid = startTextIfNeeded();
                  subscriber.next({
                    type: EventType.TEXT_MESSAGE_CONTENT,
                    messageId: mid,
                    delta,
                  } as BaseEvent);
                }
                break;
              }
              case "MESSAGE": {
                const content = String(
                  (payload as { content?: string }).content ?? "",
                );
                if (content) {
                  const mid = startTextIfNeeded();
                  subscriber.next({
                    type: EventType.TEXT_MESSAGE_CONTENT,
                    messageId: mid,
                    delta: content,
                  } as BaseEvent);
                }
                break;
              }
              case "RUN_ERROR": {
                endTextIfNeeded();
                emitRunError(
                  String(
                    (payload as { message?: string; error?: string }).message ??
                      (payload as { error?: string }).error ??
                      "Unknown gateway error",
                  ),
                );
                subscriber.complete();
                return;
              }
              case "RUN_FINISHED": {
                endTextIfNeeded();
                emitRunFinished();
                subscriber.complete();
                return;
              }
              default:
                // Silently ignore unknown gateway-native events
                // (RUN_STARTED is emitted by us; tool-call events
                // are not yet mapped to AG-UI here).
                break;
            }
          }
        }

        endTextIfNeeded();
        emitRunFinished();
        subscriber.complete();
      };

      doFetch(primaryUrl)
        .then(async (response) => {
          if (response.status === 404) {
            return doFetch(fallbackUrl);
          }
          return response;
        })
        .then(async (response) => {
          if (response.status === 404) {
            await runViaOpenAiStream();
            return;
          }
          await runViaGatewaySSE(response);
        })
        .catch((error) => {
          emitRunError(error instanceof Error ? error.message : String(error));
          subscriber.complete();
        });
    });
  }

  clone() {
    return new HermesGatewayStreamingAgent(this.agentId);
  }
}
