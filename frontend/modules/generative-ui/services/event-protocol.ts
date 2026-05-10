import type { AGUIEvent } from "../types";

export const GENERATIVE_UI_MESSAGE_CHANNEL = "generative-ui-agui";

export type WrappedAGUIMessage = {
  channel: typeof GENERATIVE_UI_MESSAGE_CHANNEL;
  event: AGUIEvent;
};

export function createEvent(
  type: string,
  payload: Record<string, unknown>,
  context: AGUIEvent["context"] = {},
): AGUIEvent {
  return { type, payload, context, ts: Date.now() };
}

export function dispatchEvent(event: AGUIEvent, target: Window): void {
  const msg: WrappedAGUIMessage = {
    channel: GENERATIVE_UI_MESSAGE_CHANNEL,
    event,
  };
  target.postMessage(msg, "*");
}

export function onSandboxEvent(callback: (event: AGUIEvent) => void): () => void {
  const handler = (ev: MessageEvent) => {
    const data = ev.data as Partial<WrappedAGUIMessage> | undefined;
    if (!data || data.channel !== GENERATIVE_UI_MESSAGE_CHANNEL || !data.event) return;
    callback(data.event);
  };
  window.addEventListener("message", handler);
  return () => window.removeEventListener("message", handler);
}
