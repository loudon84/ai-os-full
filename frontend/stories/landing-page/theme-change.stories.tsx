import type { Meta, StoryObj } from "@storybook/react";
import ThemeChange from "@/components/landing-page/color-schemas/theme-change";

const meta: Meta<typeof ThemeChange> = {
  title: "LandingPage/ThemeChange",
  component: ThemeChange,
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;
type Story = StoryObj<typeof ThemeChange>;

export const Default: Story = {
  args: {},
};

