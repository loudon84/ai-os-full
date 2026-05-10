import type { Meta, StoryObj } from "@storybook/react";
import ProjectTools from "@/components/landing-page/project-tools";

const meta: Meta<typeof ProjectTools> = {
  title: "LandingPage/ProjectTools",
  component: ProjectTools,
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;
type Story = StoryObj<typeof ProjectTools>;

export const Default: Story = {
  args: {},
};

