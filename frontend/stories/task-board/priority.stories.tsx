import type { Meta, StoryObj } from "@storybook/react";
import Priority from "@/components/task-board/common/priority";

const meta: Meta<typeof Priority> = {
  title: "TaskBoard/Common/Priority",
  component: Priority,
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;
type Story = StoryObj<typeof Priority>;

export const Default: Story = {
  args: {},
};

