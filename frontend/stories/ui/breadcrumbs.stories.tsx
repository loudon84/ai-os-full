import type { Meta, StoryObj } from "@storybook/react";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";

const meta: Meta<typeof Breadcrumbs> = {
  title: "UI/Breadcrumbs",
  component: Breadcrumbs,
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;
type Story = StoryObj<typeof Breadcrumbs>;

export const Default: Story = {
  args: {
    
  },
};

