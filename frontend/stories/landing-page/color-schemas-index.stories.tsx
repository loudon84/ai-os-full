import type { Meta, StoryObj } from "@storybook/react";
import ColorSchemas from "@/components/landing-page/color-schemas";

const meta: Meta<typeof ColorSchemas> = {
  title: "LandingPage/ColorSchemas",
  component: ColorSchemas,
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;
type Story = StoryObj<typeof ColorSchemas>;

export const Default: Story = {
  args: {},
};

