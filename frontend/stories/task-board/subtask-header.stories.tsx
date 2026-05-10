import type { Meta, StoryObj } from "@storybook/react";
import SubtaskHeader from "@/components/task-board/task-sheet/sub-tasks/subtask-header";

const meta: Meta<typeof SubtaskHeader> = {
  title: "TaskBoard/TaskSheet/SubtaskHeader",
  component: SubtaskHeader,
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;
type Story = StoryObj<typeof SubtaskHeader>;

export const Default: Story = {
  args: {},
};

