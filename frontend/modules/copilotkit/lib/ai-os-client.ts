import type {
  CopilotChatRequest,
  CopilotChatResponse,
} from "@/modules/copilotkit/lib/copilot-types";

export async function sendCopilotMessage(
  payload: CopilotChatRequest
): Promise<CopilotChatResponse> {
  const response = await fetch("/ai/copilot", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || "Copilot request failed.");
  }

  return response.json() as Promise<CopilotChatResponse>;
}
