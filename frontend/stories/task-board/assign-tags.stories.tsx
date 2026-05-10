import type { Meta, StoryObj } from "@storybook/react";
import AssignTags from "@/components/task-board/common/assign-tags";

const meta: Meta<typeof AssignTags> = {
  title: "TaskBoard/Common/AssignTags",
  component: AssignTags,
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;
type Story = StoryObj<typeof AssignTags>;

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

