import type { Meta, StoryObj } from "@storybook/react";
import TaskTable from "@/components/task-board/task-list/task-table";

const meta: Meta<typeof TaskTable> = {
  title: "TaskBoard/TaskList/TaskTable",
  component: TaskTable,
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;
type Story = StoryObj<typeof TaskTable>;

export const Default: Story = {
  args: {},
};

export const Empty: Story = {
  args: {},
  parameters: { docs: { description: { story: "Empty state with no data." } } },
};

export const Loading: Story = {
  args: {},
  parameters: { docs: { description: { story: "Loading state." } } },
};

export const Error: Story = {
  args: {},
  parameters: { docs: { description: { story: "Error state." } } },
};

