import type { Meta, StoryObj } from "@storybook/react";
import { Toast } from "@/components/ui/toast";

const meta: Meta<typeof Toast> = {
  title: "UI/Toast",
  component: Toast,
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;
type Story = StoryObj<typeof Toast>;

export const Default: Story = {
  args: {
    
  },
};

