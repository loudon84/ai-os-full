import type { Meta, StoryObj } from "@storybook/react";
import Header from "@/components/landing-page/header";

const meta: Meta<typeof Header> = {
  title: "LandingPage/Header",
  component: Header,
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;
type Story = StoryObj<typeof Header>;

export const Default: Story = {
  args: {},
};

