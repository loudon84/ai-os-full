import type { Meta, StoryObj } from "@storybook/react";
import { Tree } from "@/components/ui/tree";

const meta: Meta<typeof Tree> = {
  title: "UI/Tree",
  component: Tree,
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;
type Story = StoryObj<typeof Tree>;

export const Default: Story = {
  args: {
    
  },
};

