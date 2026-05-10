"use client";

type CopilotActionHandler = (
  payload?: Record<string, unknown>
) => void | Promise<void>;

type CopilotActionMap = Record<string, CopilotActionHandler>;

export function useCopilotActions(actionMap: CopilotActionMap) {
  async function invokeAction(
    actionId: string,
    payload?: Record<string, unknown>
  ) {
    const handler = actionMap[actionId];
    if (!handler) {
      throw new Error(`Unknown action: ${actionId}`);
    }
    await handler(payload);
  }

  return {
    invokeAction,
  };
}
