import type { Meta, StoryObj } from "@storybook/react";
import { CopilotActionList } from "@/modules/copilotkit/components/CopilotActionList";
import type { CopilotActionDefinition } from "@/modules/copilotkit/lib/copilot-types";

const meta: Meta<typeof CopilotActionList> = {
  title: "AI/CopilotActionList",
  component: CopilotActionList,
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;
type Story = StoryObj<typeof CopilotActionList>;

const mockActions: CopilotActionDefinition[] = [
  { id: "summarize-page", label: "总结当前页面" },
  { id: "draft-report", label: "生成日报摘要" },
  { id: "find-risks", label: "识别风险点" },
];

const dangerousActions: CopilotActionDefinition[] = [
  { id: "delete-all", label: "删除所有数据", dangerous: true },
  { id: "reset-config", label: "重置配置", dangerous: true },
];

export const Default: Story = {
  args: {
    actions: mockActions,
    onInvoke: (actionId) => console.log("invoke:", actionId),
  },
};

export const Empty: Story = {
  args: { actions: [] },
};

export const Forbidden: Story = {
  args: {
    actions: dangerousActions,
    onInvoke: (actionId) => console.log("invoke:", actionId),
  },
};
