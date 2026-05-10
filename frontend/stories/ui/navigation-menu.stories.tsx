import type { Meta, StoryObj } from "@storybook/react";
import { NavigationMenu } from "@/components/ui/navigation-menu";

const meta: Meta<typeof NavigationMenu> = {
  title: "UI/NavigationMenu",
  component: NavigationMenu,
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;
type Story = StoryObj<typeof NavigationMenu>;

export const Default: Story = {
  args: {
    
  },
};

