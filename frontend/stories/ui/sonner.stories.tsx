import type { Meta, StoryObj } from "@storybook/react";
import { SonnToaster as Sonner } from "@/components/ui/sonner";

const meta: Meta<typeof Sonner> = {
  title: "UI/Sonner",
  component: Sonner,
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;
type Story = StoryObj<typeof Sonner>;

export const Default: Story = {
  args: {
    
  },
};

