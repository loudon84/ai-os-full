import type { Meta, StoryObj } from "@storybook/react";
import AllComponents from "@/components/landing-page/all-components";

const meta: Meta<typeof AllComponents> = {
  title: "LandingPage/AllComponents",
  component: AllComponents,
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;
type Story = StoryObj<typeof AllComponents>;

export const Default: Story = {
  args: {},
};

