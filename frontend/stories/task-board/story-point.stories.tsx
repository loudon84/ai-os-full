import type { Meta, StoryObj } from "@storybook/react";
import StoryPoint from "@/components/task-board/common/story-point";

const meta: Meta<typeof StoryPoint> = {
  title: "TaskBoard/Common/StoryPoint",
  component: StoryPoint,
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;
type Story = StoryObj<typeof StoryPoint>;

export const Default: Story = {
  args: {},
};

