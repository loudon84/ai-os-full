import type { Meta, StoryObj } from "@storybook/react";
import { CopilotSessionPanel } from "@/modules/copilotkit/components/CopilotSessionPanel";
import type { PageCopilotContext } from "@/modules/copilotkit/lib/copilot-types";
import { useGlobalCopilotStore } from "@/modules/copilotkit/hooks/useGlobalCopilotStore";

const meta: Meta<typeof CopilotSessionPanel> = {
  title: "AI/CopilotSessionPanel",
  component: CopilotSessionPanel,
  tags: ["autodocs"],
  decorators: [
    (Story) => {
      useGlobalCopilotStore.setState({ open: true, sessionId: undefined });
      return (
        <div className="h-[600px] w-[460px] border">
          <Story />
        </div>
      );
    },
  ],
};

export default meta;
type Story = StoryObj<typeof CopilotSessionPanel>;

const mockContext: PageCopilotContext = {
  pageId: "dashboard",
  pageTitle: "工作台",
  route: "/dashboard",
  module: "portal",
  summary: "当前页面展示任务摘要、待办事项和最近结果。",
  selection: { type: "none", payload: null },
  actions: [
    { id: "summarize-page", label: "总结当前页面" },
    { id: "draft-report", label: "生成日报摘要" },
    { id: "find-risks", label: "识别风险点" },
  ],
};

export const Default: Story = {
  args: { context: mockContext },
};

export const Empty: Story = {
  args: { context: undefined },
};
