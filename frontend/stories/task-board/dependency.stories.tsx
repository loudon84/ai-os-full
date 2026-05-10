import type { Meta, StoryObj } from "@storybook/react";
import Dependency from "@/components/task-board/common/dependency";

const meta: Meta<typeof Dependency> = {
  title: "TaskBoard/Common/Dependency",
  component: Dependency,
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;
type Story = StoryObj<typeof Dependency>;

export const Default: Story = {
  args: {},
};

