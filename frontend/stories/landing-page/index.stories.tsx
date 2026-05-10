import type { Meta, StoryObj } from "@storybook/react";
import LandingPage from "@/components/landing-page/index";

const meta: Meta<typeof LandingPage> = {
  title: "LandingPage/Index",
  component: LandingPage,
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;
type Story = StoryObj<typeof LandingPage>;

export const Default: Story = {
  args: {},
};

