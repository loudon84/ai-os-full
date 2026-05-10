import type { Meta, StoryObj } from "@storybook/react";
import Attachments from "@/components/task-board/task-sheet/attachments";

const meta: Meta<typeof Attachments> = {
  title: "TaskBoard/TaskSheet/Attachments",
  component: Attachments,
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;
type Story = StoryObj<typeof Attachments>;

export const Default: Story = {
  args: {},
};

export const Empty: Story = {
  args: {},
  parameters: { docs: { description: { story: "Empty state with no data." } } },
};

export const Loading: Story = {
  args: {},
  parameters: { docs: { description: { story: "Loading state." } } },
};

export const Error: Story = {
  args: {},
  parameters: { docs: { description: { story: "Error state." } } },
};

