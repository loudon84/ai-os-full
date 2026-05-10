import type { Meta, StoryObj } from "@storybook/react";
import { Calendar } from "@/components/ui/calendar";

const meta: Meta<typeof Calendar> = {
  title: "UI/Calendar",
  component: Calendar,
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;
type Story = StoryObj<typeof Calendar>;

export const Default: Story = {
  args: {
    
  },
};

export const Loading: Story = {
  args: { className: "animate-pulse" },
};

