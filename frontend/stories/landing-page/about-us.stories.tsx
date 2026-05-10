import type { Meta, StoryObj } from "@storybook/react";
import AboutUs from "@/components/landing-page/about-us";

const meta: Meta<typeof AboutUs> = {
  title: "LandingPage/AboutUs",
  component: AboutUs,
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;
type Story = StoryObj<typeof AboutUs>;

export const Default: Story = {
  args: {},
};

