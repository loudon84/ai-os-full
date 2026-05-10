import type { Meta, StoryObj } from "@storybook/react";
import SidebarImage from "@/components/partials/customizer/sidebar-image";

const meta: Meta<typeof SidebarImage> = {
  title: "Partials/Customizer/SidebarImage",
  component: SidebarImage,
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;
type Story = StoryObj<typeof SidebarImage>;

export const Default: Story = {
  args: {},
};

