import type { Meta, StoryObj } from "@storybook/react";
import Task from "@/components/task-board/task";

const meta: Meta<typeof Task> = {
  title: "TaskBoard/Task",
  component: Task,
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;
type Story = StoryObj<typeof Task>;

export const Default: Story = {
  args: {},
};

export const Empty: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: "Empty state with no data.",
      },
    },
  },
};

export const Loading: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: "Loading state.",
      },
    },
  },
};

export const Error: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: "Error state when data fails to load.",
      },
    },
  },
};

