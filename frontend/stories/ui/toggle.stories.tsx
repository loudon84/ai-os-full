import type { Meta, StoryObj } from "@storybook/react";
import { Toggle } from "@/components/ui/toggle";

const meta: Meta<typeof Toggle> = {
  title: "UI/Toggle",
  component: Toggle,
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;
type Story = StoryObj<typeof Toggle>;

export const Default: Story = {
  args: {
    children: "Toggle",
  },
};

export const Empty: Story = { args: { children: "" } };
export const Pressed: Story = { args: { defaultPressed: true, children: "Pressed" } };
export const Outline: Story = { args: { variant: "outline", children: "Outline" } };
export const Disabled: Story = { args: { disabled: true, children: "Disabled" } };

