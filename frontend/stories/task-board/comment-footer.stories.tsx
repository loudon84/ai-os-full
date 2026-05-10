import type { Meta, StoryObj } from "@storybook/react";
import CommentFooter from "@/components/task-board/task-sheet/comments/comment-footer";

const meta: Meta<typeof CommentFooter> = {
  title: "TaskBoard/TaskSheet/CommentFooter",
  component: CommentFooter,
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;
type Story = StoryObj<typeof CommentFooter>;

export const Default: Story = {
  args: {},
};

