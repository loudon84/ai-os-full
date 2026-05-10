import type { Meta, StoryObj } from "@storybook/react";
import TaskBoard from "@/components/task-board/index";

const meta: Meta<typeof TaskBoard> = {
  title: "TaskBoard/Index",
  component: TaskBoard,
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;
type Story = StoryObj<typeof TaskBoard>;

export const Default: Story = {
  args: {},
};

