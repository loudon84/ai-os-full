import type { Meta, StoryObj } from "@storybook/react";
import Header from "@/components/partials/header";

const meta: Meta<typeof Header> = {
  title: "Partials/Header/Index",
  component: Header,
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;
type Story = StoryObj<typeof Header>;

export const Default: Story = {
  args: {},
};

