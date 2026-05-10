import type { Meta, StoryObj } from "@storybook/react";
import SubTasks from "@/components/task-board/task-sheet/sub-tasks";

const meta: Meta<typeof SubTasks> = {
  title: "TaskBoard/TaskSheet/SubTasks",
  component: SubTasks,
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;
type Story = StoryObj<typeof SubTasks>;

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

