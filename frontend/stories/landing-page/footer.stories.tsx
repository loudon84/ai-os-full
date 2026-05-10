import type { Meta, StoryObj } from "@storybook/react";
import Footer from "@/components/landing-page/footer";

const meta: Meta<typeof Footer> = {
  title: "LandingPage/Footer",
  component: Footer,
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;
type Story = StoryObj<typeof Footer>;

export const Default: Story = {
  args: {},
};

