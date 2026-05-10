/**
 * Hermes BFF - Gateway Proxy Layer
 * Server-side only. Encapsulates Gateway base URL, auth token, and timeout.
 * All Route Handlers call fetchFromGateway() to proxy requests to Hermes Gateway.
 */
import type { ZodType } from "zod";
import type { HermesError } from "../types/hermes.types";

type GatewayConfig = {
  baseUrl: string;
  token: string;
  timeoutMs: number;
};

function getGatewayConfig(): GatewayConfig {
  return {
    baseUrl: process.env.HERMES_GATEWAY_BASE_URL ?? "http://localhost:8642",
    token: process.env.HERMES_GATEWAY_TOKEN ?? "",
    timeoutMs: Number(process.env.HERMES_GATEWAY_TIMEOUT_MS) || 10000,
  };
}

export class GatewayUnreachableError extends Error {
  public readonly code = "HERMES_GATEWAY_UNREACHABLE" as const;
  constructor(message: string) {
    super(message);
    this.name = "GatewayUnreachableError";
  }
}

export class ResponseDriftError extends Error {
  public readonly code = "HERMES_RESPONSE_DRIFT" as const;
  constructor(message: string, public readonly details?: unknown) {
    super(message);
    this.name = "ResponseDriftError";
  }
}

export async function fetchFromGateway<T>(
  path: string,
  options?: {
    method?: "GET" | "POST";
    body?: unknown;
    schema?: ZodType<T>;
  }
): Promise<T> {
  const config = getGatewayConfig();
  const url = `${config.baseUrl}${path}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), config.timeoutMs);

  try {
    const res = await fetch(url, {
      method: options?.method ?? "GET",
      headers: {
        Authorization: `Bearer ${config.token}`,
        "Content-Type": "application/json",
      },
      body: options?.body ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
      cache: "no-store",
    });

    if (!res.ok) {
      const text = await res.text();
      throw new GatewayUnreachableError(
        `Gateway returned ${res.status}: ${text}`
      );
    }

    const json = await res.json();

    if (options?.schema) {
      const parsed = options.schema.safeParse(json);
      if (!parsed.success) {
        throw new ResponseDriftError(
          "Gateway response failed Zod validation",
          parsed.error.flatten()
        );
      }
      return parsed.data;
    }

    return json as T;
  } catch (err) {
    if (err instanceof GatewayUnreachableError || err instanceof ResponseDriftError) {
      throw err;
    }
    if (err instanceof Error && err.name === "AbortError") {
      throw new GatewayUnreachableError(
        `Gateway request timed out after ${config.timeoutMs}ms`
      );
    }
    throw new GatewayUnreachableError(
      `Gateway unreachable: ${err instanceof Error ? err.message : String(err)}`
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

export function toHermesError(err: unknown): HermesError {
  if (err instanceof GatewayUnreachableError) {
    return { code: "HERMES_GATEWAY_UNREACHABLE", message: err.message };
  }
  if (err instanceof ResponseDriftError) {
    return { code: "HERMES_RESPONSE_DRIFT", message: err.message, details: { zodError: err.details } };
  }
  return {
    code: "HERMES_GATEWAY_UNREACHABLE",
    message: err instanceof Error ? err.message : String(err),
  };
}
