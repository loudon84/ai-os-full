import type { Meta, StoryObj } from "@storybook/react";
import CreateBoard from "@/components/task-board/create-borad";

const meta: Meta<typeof CreateBoard> = {
  title: "TaskBoard/CreateBoard",
  component: CreateBoard,
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;
type Story = StoryObj<typeof CreateBoard>;

export const Default: Story = {
  args: {},
};

