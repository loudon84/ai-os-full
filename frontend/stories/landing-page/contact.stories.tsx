import type { Meta, StoryObj } from "@storybook/react";
import Contact from "@/components/landing-page/contact";

const meta: Meta<typeof Contact> = {
  title: "LandingPage/Contact",
  component: Contact,
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;
type Story = StoryObj<typeof Contact>;

export const Default: Story = {
  args: {},
};

