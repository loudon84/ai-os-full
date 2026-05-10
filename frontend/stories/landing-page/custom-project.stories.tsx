import type { Meta, StoryObj } from "@storybook/react";
import CustomProject from "@/components/landing-page/custom-project";

const meta: Meta<typeof CustomProject> = {
  title: "LandingPage/CustomProject",
  component: CustomProject,
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;
type Story = StoryObj<typeof CustomProject>;

export const Default: Story = {
  args: {},
};

