"use client";

import { CopilotSidebar } from "@copilotkit/react-ui";
import "@copilotkit/react-ui/styles.css";
import { useGlobalCopilotStore } from "@/modules/copilotkit/hooks/useGlobalCopilotStore";

/** CopilotSidebar panel width (px) */
export const COPILOT_SIDEBAR_WIDTH = 400;

export function GlobalCopilotSidebar() {
  const setOpen = useGlobalCopilotStore((s) => s.setOpen);

  return (
    <CopilotSidebar
      defaultOpen={false}
      clickOutsideToClose={false}
      onSetOpen={setOpen}
      labels={{
        title: "AI OS 助手",
        initial:
          "你好！我是 AI OS 助手，可以帮你总结页面、分析数据、执行操作。有什么可以帮你的？",
        placeholder: "输入你的问题...",
      }}
    />
  );
}
