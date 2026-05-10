import type { Meta, StoryObj } from "@storybook/react";
import ShowcaseContent from "@/components/landing-page/showcase/showcase-content";

const meta: Meta<typeof ShowcaseContent> = {
  title: "LandingPage/ShowcaseContent",
  component: ShowcaseContent,
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;
type Story = StoryObj<typeof ShowcaseContent>;

export const Default: Story = {
  args: {},
};

