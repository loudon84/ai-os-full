import type { Meta, StoryObj } from "@storybook/react";
import { Collapsible } from "@/components/ui/collapsible";

const meta: Meta<typeof Collapsible> = {
  title: "UI/Collapsible",
  component: Collapsible,
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;
type Story = StoryObj<typeof Collapsible>;

export const Default: Story = {
  args: {
    
  },
};

export const Loading: Story = { args: {} };

