import type { Meta, StoryObj } from "@storybook/react";
import NavMenu from "@/components/landing-page/header/nav-menu";

const meta: Meta<typeof NavMenu> = {
  title: "LandingPage/NavMenu",
  component: NavMenu,
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;
type Story = StoryObj<typeof NavMenu>;

export const Default: Story = {
  args: {},
};

