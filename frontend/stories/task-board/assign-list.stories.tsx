import type { Meta, StoryObj } from "@storybook/react";
import AssignList from "@/components/task-board/common/assign-list";

const meta: Meta<typeof AssignList> = {
  title: "TaskBoard/Common/AssignList",
  component: AssignList,
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;
type Story = StoryObj<typeof AssignList>;

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

