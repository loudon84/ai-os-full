import type { Meta, StoryObj } from "@storybook/react";
import SheetActions from "@/components/task-board/task-sheet/sheet-actions";

const meta: Meta<typeof SheetActions> = {
  title: "TaskBoard/TaskSheet/SheetActions",
  component: SheetActions,
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;
type Story = StoryObj<typeof SheetActions>;

export const Default: Story = {
  args: {},
};

