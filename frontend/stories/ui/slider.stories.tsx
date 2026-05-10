import type { Meta, StoryObj } from "@storybook/react";
import { Slider } from "@/components/ui/slider";

const meta: Meta<typeof Slider> = {
  title: "UI/Slider",
  component: Slider,
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;
type Story = StoryObj<typeof Slider>;

export const Default: Story = {
  args: {
    defaultValue: [50], max: 100, step: 1,
  },
};

export const Empty: Story = { args: { defaultValue: [0], max: 100 } };
export const Full: Story = { args: { defaultValue: [100], max: 100 } };
export const WithTooltip: Story = { args: { defaultValue: [30], max: 100, showTooltip: true } };

