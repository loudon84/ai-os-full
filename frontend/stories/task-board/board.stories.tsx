import type { Meta, StoryObj } from "@storybook/react";
import Board from "@/components/task-board/board";

const meta: Meta<typeof Board> = {
  title: "TaskBoard/Board",
  component: Board,
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;
type Story = StoryObj<typeof Board>;

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

