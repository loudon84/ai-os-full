import type { Meta, StoryObj } from "@storybook/react";
import AboutDashtail from "@/components/landing-page/about-dashtail";

const meta: Meta<typeof AboutDashtail> = {
  title: "LandingPage/AboutDashtail",
  component: AboutDashtail,
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;
type Story = StoryObj<typeof AboutDashtail>;

export const Default: Story = {
  args: {},
};

