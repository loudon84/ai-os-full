import type { Meta, StoryObj } from "@storybook/react";
import TaskSheetHeader from "@/components/task-board/task-sheet/task-sheet-header";

const meta: Meta<typeof TaskSheetHeader> = {
  title: "TaskBoard/TaskSheet/TaskSheetHeader",
  component: TaskSheetHeader,
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;
type Story = StoryObj<typeof TaskSheetHeader>;

export const Default: Story = {
  args: {},
};

