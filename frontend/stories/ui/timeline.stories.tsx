import type { Meta, StoryObj } from "@storybook/react";
import { Timeline } from "@/components/ui/timeline";

const meta: Meta<typeof Timeline> = {
  title: "UI/Timeline",
  component: Timeline,
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;
type Story = StoryObj<typeof Timeline>;

export const Default: Story = {
  args: {
    
  },
};

