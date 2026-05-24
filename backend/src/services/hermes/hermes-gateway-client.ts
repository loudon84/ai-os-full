import type { AppConfig } from "../../config.js";

export interface GatewayRunRequest {
  run_id: string;
  workspace_id: string;
  user_id: string;
  run_type: string;
  input: Record<string, unknown>;
  context?: Record<string, unknown>;
  prompt?: string;
}

export interface GatewayRunResponse {
  gateway_run_id?: string;
  status?: string;
}

export interface GatewayHealthResult {
  healthy: boolean;
  statusCode?: number;
  error?: string;
}

export type FetchFn = typeof fetch;

export class HermesGatewayClient {
  constructor(
    private readonly config: AppConfig,
    private readonly fetchImpl: FetchFn = fetch,
  ) {}

  async healthCheck(baseUrl: string, authToken?: string | null): Promise<GatewayHealthResult> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.hermesGatewayTimeoutMs);
    try {
      const headers: Record<string, string> = {};
      if (authToken) headers.Authorization = `Bearer ${authToken}`;

      const response = await this.fetchImpl(`${baseUrl.replace(/\/$/, "")}/health`, {
        method: "GET",
        headers,
        signal: controller.signal,
      });
      return { healthy: response.ok, statusCode: response.status };
    } catch (err) {
      return {
        healthy: false,
        error: err instanceof Error ? err.message : "health check failed",
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  async createRun(
    baseUrl: string,
    authToken: string | null | undefined,
    request: GatewayRunRequest,
  ): Promise<GatewayRunResponse> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.hermesGatewayTimeoutMs);
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (authToken) headers.Authorization = `Bearer ${authToken}`;

      const response = await this.fetchImpl(`${baseUrl.replace(/\/$/, "")}/v1/runs`, {
        method: "POST",
        headers,
        body: JSON.stringify(request),
        signal: controller.signal,
      });

      if (!response.ok) {
        const text = await response.text().catch(() => "");
        throw new Error(`Gateway run failed (${response.status}): ${text}`);
      }

      return (await response.json()) as GatewayRunResponse;
    } finally {
      clearTimeout(timeout);
    }
  }

  async *streamRunEvents(
    baseUrl: string,
    gatewayRunId: string,
    authToken?: string | null,
  ): AsyncGenerator<Record<string, unknown>> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.hermesRunMaxDurationSec * 1000);
    try {
      const headers: Record<string, string> = { Accept: "text/event-stream" };
      if (authToken) headers.Authorization = `Bearer ${authToken}`;

      const response = await this.fetchImpl(
        `${baseUrl.replace(/\/$/, "")}/v1/runs/${gatewayRunId}/events`,
        { method: "GET", headers, signal: controller.signal },
      );

      if (!response.ok || !response.body) {
        throw new Error(`Gateway events stream failed (${response.status})`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";
        for (const part of parts) {
          const dataLine = part.split("\n").find((line) => line.startsWith("data: "));
          if (!dataLine) continue;
          const json = dataLine.slice(6);
          if (json === "[DONE]") return;
          try {
            yield JSON.parse(json) as Record<string, unknown>;
          } catch {
            // skip malformed SSE chunk
          }
        }
      }
    } finally {
      clearTimeout(timeout);
    }
  }
}
