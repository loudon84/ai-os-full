"use client";

import { Bot } from "lucide-react";
import { useChatContext } from "@copilotkit/react-ui";
import { Button } from "@/components/ui/button";
import { useGlobalCopilotStore } from "@/modules/copilotkit/hooks/useGlobalCopilotStore";

export function GlobalCopilotTrigger() {
  const { open, setOpen } = useChatContext();
  const setGlobalOpen = useGlobalCopilotStore((state) => state.setOpen);

  return (
    <Button
      type="button"
      className="fixed right-6 z-50 rounded-full shadow-lg bottom-[max(1.5rem,env(safe-area-inset-bottom))]"
      onClick={() => {
        setOpen(!open);
        setGlobalOpen(!open);
      }}
    >
      <Bot className="mr-2 h-4 w-4" />
      AI 助手
    </Button>
  );
}
