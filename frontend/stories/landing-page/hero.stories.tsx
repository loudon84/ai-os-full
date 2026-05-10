import type { Meta, StoryObj } from "@storybook/react";
import Hero from "@/components/landing-page/hero";

const meta: Meta<typeof Hero> = {
  title: "LandingPage/Hero",
  component: Hero,
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;
type Story = StoryObj<typeof Hero>;

export const Default: Story = {
  args: {},
};

