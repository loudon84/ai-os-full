import type { Meta, StoryObj } from "@storybook/react";
import TaskList from "@/components/task-board/task-list";

const meta: Meta<typeof TaskList> = {
  title: "TaskBoard/TaskList/Index",
  component: TaskList,
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;
type Story = StoryObj<typeof TaskList>;

export const Default: Story = {
  args: {},
};

