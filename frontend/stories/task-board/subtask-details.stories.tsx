import type { Meta, StoryObj } from "@storybook/react";
import SubtaskDetails from "@/components/task-board/task-sheet/sub-tasks/subtask-details";

const meta: Meta<typeof SubtaskDetails> = {
  title: "TaskBoard/TaskSheet/SubtaskDetails",
  component: SubtaskDetails,
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;
type Story = StoryObj<typeof SubtaskDetails>;

export const Default: Story = {
  args: {},
};

