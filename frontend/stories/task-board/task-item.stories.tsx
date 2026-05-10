import type { Meta, StoryObj } from "@storybook/react";
import TaskItem from "@/components/task-board/task-sheet/sub-tasks/task-item";

const meta: Meta<typeof TaskItem> = {
  title: "TaskBoard/TaskSheet/TaskItem",
  component: TaskItem,
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;
type Story = StoryObj<typeof TaskItem>;

export const Default: Story = {
  args: {},
};

