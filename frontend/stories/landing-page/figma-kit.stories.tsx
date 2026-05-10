import type { Meta, StoryObj } from "@storybook/react";
import FigmaKit from "@/components/landing-page/figma-kit";

const meta: Meta<typeof FigmaKit> = {
  title: "LandingPage/FigmaKit",
  component: FigmaKit,
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;
type Story = StoryObj<typeof FigmaKit>;

export const Default: Story = {
  args: {},
};

