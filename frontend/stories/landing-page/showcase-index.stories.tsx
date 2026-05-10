import type { Meta, StoryObj } from "@storybook/react";
import Showcase from "@/components/landing-page/showcase";

const meta: Meta<typeof Showcase> = {
  title: "LandingPage/Showcase",
  component: Showcase,
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;
type Story = StoryObj<typeof Showcase>;

export const Default: Story = {
  args: {},
};

