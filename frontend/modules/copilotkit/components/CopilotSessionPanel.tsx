"use client";

import { useMemo, useState } from "react";
import { nanoid } from "nanoid";
import { sendCopilotMessage } from "@/modules/copilotkit/lib/ai-os-client";
import type {
  CopilotMessage,
  PageCopilotContext,
} from "@/modules/copilotkit/lib/copilot-types";
import { CopilotContextCard } from "./CopilotContextCard";
import { CopilotMessageList } from "./CopilotMessageList";
import { CopilotComposer } from "./CopilotComposer";
import { CopilotActionList } from "./CopilotActionList";
import { useGlobalCopilotStore } from "@/modules/copilotkit/hooks/useGlobalCopilotStore";

type CopilotSessionPanelProps = {
  context?: PageCopilotContext;
};

export function CopilotSessionPanel({
  context,
}: CopilotSessionPanelProps) {
  const [messages, setMessages] = useState<CopilotMessage[]>([]);
  const [loading, setLoading] = useState(false);

  const sessionId = useGlobalCopilotStore((state) => state.sessionId);
  const setSessionId = useGlobalCopilotStore((state) => state.setSessionId);

  async function handleSend(content: string) {
    const userMessage: CopilotMessage = {
      id: nanoid(),
      role: "user",
      content,
      createdAt: new Date().toISOString(),
      status: "done",
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setLoading(true);

    try {
      const response = await sendCopilotMessage({
        sessionId,
        messages: nextMessages,
        pageContext: context,
      });

      setSessionId(response.sessionId);
      setMessages((prev) => [...prev, response.reply]);
    } catch (error) {
      const errorMessage: CopilotMessage = {
        id: nanoid(),
        role: "assistant",
        content:
          error instanceof Error
            ? `请求失败：${error.message}`
            : "请求失败，请稍后重试。",
        createdAt: new Date().toISOString(),
        status: "error",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  }

  const actions = useMemo(() => context?.actions ?? [], [context]);

  return (
    <div className="flex h-full flex-col">
      <div className="border-b p-4">
        <CopilotContextCard context={context} />
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        <CopilotMessageList messages={messages} />
      </div>

      <CopilotActionList
        actions={actions}
        onInvoke={(actionId) => {
          void handleSend(`请执行动作：${actionId}`);
        }}
      />

      <CopilotComposer loading={loading} onSend={handleSend} />
    </div>
  );
}
