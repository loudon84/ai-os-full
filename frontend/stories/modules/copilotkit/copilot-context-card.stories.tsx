import type { Meta, StoryObj } from "@storybook/react";
import { CopilotContextCard } from "@/modules/copilotkit/components/CopilotContextCard";
import type { PageCopilotContext } from "@/modules/copilotkit/lib/copilot-types";

const meta: Meta<typeof CopilotContextCard> = {
  title: "AI/CopilotContextCard",
  component: CopilotContextCard,
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;
type Story = StoryObj<typeof CopilotContextCard>;

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
  ],
};

export const Default: Story = {
  args: { context: mockContext },
};

export const Empty: Story = {
  args: { context: undefined },
};
