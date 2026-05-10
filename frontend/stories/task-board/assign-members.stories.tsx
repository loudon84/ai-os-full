import type { Meta, StoryObj } from "@storybook/react";
import AssignMembers from "@/components/task-board/common/assign-members";

const meta: Meta<typeof AssignMembers> = {
  title: "TaskBoard/Common/AssignMembers",
  component: AssignMembers,
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;
type Story = StoryObj<typeof AssignMembers>;

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

