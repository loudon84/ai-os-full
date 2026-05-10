/**
 * Hermes WebUI BFF (runtime)
 * Server-side configuration helpers for proxying to local hermes-webui backend.
 */

export type HermesWebuiConfig = {
  baseUrl: string;
};

const DEFAULT_WEBUI_BASE_URL = "http://localhost:8787";

export function getHermesWebuiConfig(): HermesWebuiConfig {
  const raw =
    process.env.HERMES_WEBUI_BASE_URL ??
    process.env.NEXT_PUBLIC_HERMES_WEBUI_BASE_URL ??
    DEFAULT_WEBUI_BASE_URL;

  debugger

  return {
    baseUrl: raw.trim().replace(/\/+$/, ""),
  };
}

