export type {
  HermesClient,
  HermesClientSendOptions,
  HermesStreamCallbacks,
  HermesPanelMessage,
} from "./hermes-client.types";
export { WebHermesClient } from "./web-hermes-client";
export { DesktopHermesClient, type DesktopHermesApi } from "./desktop-hermes-client";

import { DesktopHermesClient } from "./desktop-hermes-client";
import type { HermesClient } from "./hermes-client.types";
import { WebHermesClient } from "./web-hermes-client";

export function createHermesClient(): HermesClient {
  if (typeof window !== "undefined") {
    const w = window as Window & { hermesAPI?: { sendMessage?: unknown } };
    if (w.hermesAPI && typeof w.hermesAPI.sendMessage === "function") {
      return new DesktopHermesClient();
    }
  }
  return new WebHermesClient();
}
