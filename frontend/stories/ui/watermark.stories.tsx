import type { Meta, StoryObj } from "@storybook/react";
import { Watermark } from "@/components/ui/watermark";

const meta: Meta<typeof Watermark> = {
  title: "UI/Watermark",
  component: Watermark,
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;
type Story = StoryObj<typeof Watermark>;

export const Default: Story = {
  args: {
    content: "Watermark",
    children: <div className="h-48 w-full bg-default-100 rounded-lg" />,
  },
};

export const Empty: Story = {
  args: { content: "", children: <div className="h-48 w-full bg-default-100 rounded-lg" /> },
};
export const Multiline: Story = {
  args: { content: ["Line 1", "Line 2"], children: <div className="h-48 w-full bg-default-100 rounded-lg" /> },
};

