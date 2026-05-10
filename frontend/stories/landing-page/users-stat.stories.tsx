import type { Meta, StoryObj } from "@storybook/react";
import UsersStat from "@/components/landing-page/color-schemas/users-stat";

const meta: Meta<typeof UsersStat> = {
  title: "LandingPage/UsersStat",
  component: UsersStat,
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;
type Story = StoryObj<typeof UsersStat>;

export const Default: Story = {
  args: {},
};

