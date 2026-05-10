import type { Meta, StoryObj } from "@storybook/react";
import Footer from "@/components/partials/footer";

const meta: Meta<typeof Footer> = {
  title: "Partials/Footer/Index",
  component: Footer,
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;
type Story = StoryObj<typeof Footer>;

export const Default: Story = {
  args: {},
};

