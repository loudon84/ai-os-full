import type { Meta, StoryObj } from "@storybook/react";
import { Progress } from "@/components/ui/progress";

const meta: Meta<typeof Progress> = {
  title: "UI/Progress",
  component: Progress,
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;
type Story = StoryObj<typeof Progress>;

export const Default: Story = {
  args: {
    value: 60,
  },
};

export const Empty: Story = { args: { value: 0 } };
export const Loading: Story = { args: { value: 0, isAnimate: true } };
export const Low: Story = { args: { value: 20 } };
export const High: Story = { args: { value: 90 } };
export const Complete: Story = { args: { value: 100 } };

