import type { Meta, StoryObj } from "@storybook/react";
import SidebarChange from "@/components/partials/customizer/sidebar-change";

const meta: Meta<typeof SidebarChange> = {
  title: "Partials/Customizer/SidebarChange",
  component: SidebarChange,
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;
type Story = StoryObj<typeof SidebarChange>;

export const Default: Story = {
  args: {},
};

