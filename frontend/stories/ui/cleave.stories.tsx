import type { Meta, StoryObj } from "@storybook/react";
import { CleaveInput as Cleave } from "@/components/ui/cleave";

const meta: Meta<typeof Cleave> = {
  title: "UI/Cleave",
  component: Cleave,
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;
type Story = StoryObj<typeof Cleave>;

export const Default: Story = {
  args: {
    placeholder: "Enter number...",
  },
};

