import type { Meta, StoryObj } from "@storybook/react";
import Affix from "@/components/ui/affix";

const meta: Meta<typeof Affix> = {
  title: "UI/Affix",
  component: Affix,
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;
type Story = StoryObj<typeof Affix>;

export const Default: Story = {
  args: {
    children: <div className="bg-primary text-primary-foreground p-2 rounded">Affixed</div>,
  },
};

