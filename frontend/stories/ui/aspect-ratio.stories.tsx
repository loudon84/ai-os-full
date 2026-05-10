import type { Meta, StoryObj } from "@storybook/react";
import { AspectRatio } from "@/components/ui/aspect-ratio";

const meta: Meta<typeof AspectRatio> = {
  title: "UI/AspectRatio",
  component: AspectRatio,
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;
type Story = StoryObj<typeof AspectRatio>;

export const Default: Story = {
  args: {
    ratio: 16/9,
    children: <div className="bg-default-200 h-full w-full rounded" />,
  },
};

