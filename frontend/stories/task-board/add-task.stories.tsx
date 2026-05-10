import type { Meta, StoryObj } from "@storybook/react";
import AddTask from "@/components/task-board/add-task";

const meta: Meta<typeof AddTask> = {
  title: "TaskBoard/AddTask",
  component: AddTask,
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;
type Story = StoryObj<typeof AddTask>;

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

