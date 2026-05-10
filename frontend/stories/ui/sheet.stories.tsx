import type { Meta, StoryObj } from "@storybook/react";
import { Sheet } from "@/components/ui/sheet";

const meta: Meta<typeof Sheet> = {
  title: "UI/Sheet",
  component: Sheet,
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;
type Story = StoryObj<typeof Sheet>;

export const Default: Story = {
  args: {
    
  },
};

