import type { Meta, StoryObj } from "@storybook/react";
import { Separator } from "@/components/ui/separator";

const meta: Meta<typeof Separator> = {
  title: "UI/Separator",
  component: Separator,
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;
type Story = StoryObj<typeof Separator>;

export const Default: Story = {
  args: {
    
  },
};

export const Vertical: Story = { args: { orientation: "vertical", className: "h-5" } };

