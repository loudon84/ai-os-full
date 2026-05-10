import type { Meta, StoryObj } from "@storybook/react";
import Comments from "@/components/task-board/task-sheet/comments";

const meta: Meta<typeof Comments> = {
  title: "TaskBoard/TaskSheet/Comments",
  component: Comments,
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;
type Story = StoryObj<typeof Comments>;

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

