import type { Meta, StoryObj } from "@storybook/react";
import Workload from "@/components/landing-page/color-schemas/workload";

const meta: Meta<typeof Workload> = {
  title: "LandingPage/Workload",
  component: Workload,
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;
type Story = StoryObj<typeof Workload>;

export const Default: Story = {
  args: {},
};

