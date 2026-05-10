import type { Meta, StoryObj } from "@storybook/react";
import TaskDate from "@/components/task-board/common/task-date";

const meta: Meta<typeof TaskDate> = {
  title: "TaskBoard/Common/TaskDate",
  component: TaskDate,
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;
type Story = StoryObj<typeof TaskDate>;

export const Default: Story = {
  args: {},
};

