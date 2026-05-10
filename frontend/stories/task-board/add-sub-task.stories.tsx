import type { Meta, StoryObj } from "@storybook/react";
import AddSubTask from "@/components/task-board/task-sheet/sub-tasks/add-sub-task";

const meta: Meta<typeof AddSubTask> = {
  title: "TaskBoard/TaskSheet/AddSubTask",
  component: AddSubTask,
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;
type Story = StoryObj<typeof AddSubTask>;

export const Default: Story = {
  args: {},
};

