import type { Meta, StoryObj } from "@storybook/react";
import Sidebar from "@/components/partials/sidebar";

const meta: Meta<typeof Sidebar> = {
  title: "Partials/Sidebar/Index",
  component: Sidebar,
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;
type Story = StoryObj<typeof Sidebar>;

export const Default: Story = {
  args: {},
};

