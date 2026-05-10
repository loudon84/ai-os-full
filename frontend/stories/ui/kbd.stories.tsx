import type { Meta, StoryObj } from "@storybook/react";
import { Kbd } from "@/components/ui/kbd";

const meta: Meta<typeof Kbd> = {
  title: "UI/Kbd",
  component: Kbd,
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;
type Story = StoryObj<typeof Kbd>;

export const Default: Story = {
  args: {
    children: "Ctrl",
  },
};

export const Empty: Story = { args: { children: "" } };
export const LongContent: Story = { args: { children: "Ctrl+Shift+Alt+Delete" } };

