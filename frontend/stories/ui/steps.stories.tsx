import type { Meta, StoryObj } from "@storybook/react";
import { Stepper as Steps } from "@/components/ui/steps";

const meta: Meta<typeof Steps> = {
  title: "UI/Steps",
  component: Steps,
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;
type Story = StoryObj<typeof Steps>;

export const Default: Story = {
  args: {
    
  },
};

