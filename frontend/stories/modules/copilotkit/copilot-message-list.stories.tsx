import type { Meta, StoryObj } from "@storybook/react";
import { CopilotMessageList } from "@/modules/copilotkit/components/CopilotMessageList";
import type { CopilotMessage } from "@/modules/copilotkit/lib/copilot-types";

const meta: Meta<typeof CopilotMessageList> = {
  title: "AI/CopilotMessageList",
  component: CopilotMessageList,
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;
type Story = StoryObj<typeof CopilotMessageList>;

const mockMessages: CopilotMessage[] = [
  {
    id: "1",
    role: "user",
    content: "请总结当前页面",
    createdAt: "2026-04-18T10:00:00Z",
    status: "done",
  },
  {
    id: "2",
    role: "assistant",
    content: "当前页面为「工作台」，展示任务摘要、待办事项和最近结果。",
    createdAt: "2026-04-18T10:00:01Z",
    status: "done",
  },
];

export const Default: Story = {
  args: { messages: mockMessages },
};

export const Empty: Story = {
  args: { messages: [] },
};
