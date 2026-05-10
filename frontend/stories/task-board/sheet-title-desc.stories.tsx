import type { Meta, StoryObj } from "@storybook/react";
import SheetTitleDesc from "@/components/task-board/task-sheet/sheet-title-desc";

const meta: Meta<typeof SheetTitleDesc> = {
  title: "TaskBoard/TaskSheet/SheetTitleDesc",
  component: SheetTitleDesc,
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;
type Story = StoryObj<typeof SheetTitleDesc>;

export const Default: Story = {
  args: {},
};

