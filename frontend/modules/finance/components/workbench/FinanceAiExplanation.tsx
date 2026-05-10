"use client";

import { usePageCopilotContext } from "@/modules/copilotkit/hooks/usePageCopilotContext";
import { CopilotSessionPanel } from "@/modules/copilotkit/components/CopilotSessionPanel";

export function FinanceAiExplanation() {
  const context = usePageCopilotContext({
    pageId: "finance-workbench",
    pageTitle: "财务工作台",
    route: "/finance",
    module: "finance",
    summary: "AI 解读财务分析结果",
  });

  return (
    <div className="h-[400px]">
      <CopilotSessionPanel context={context} />
    </div>
  );
}
