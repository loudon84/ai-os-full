import type { Meta, StoryObj } from "@storybook/react";
import TaskSheet from "@/components/task-board/task-sheet";

const meta: Meta<typeof TaskSheet> = {
  title: "TaskBoard/TaskSheet/Index",
  component: TaskSheet,
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;
type Story = StoryObj<typeof TaskSheet>;

export const Default: Story = {
  args: {},
};

