import type { Meta, StoryObj } from "@storybook/react";
import { Input } from "@/components/ui/input";

const meta: Meta<typeof Input> = {
  title: "UI/Input",
  component: Input,
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;
type Story = StoryObj<typeof Input>;

export const Default: Story = {
  args: {
    placeholder: "Type here...",
  },
};

export const Empty: Story = { args: { placeholder: "Empty", value: "" } };
export const Loading: Story = { args: { placeholder: "Loading...", disabled: true, value: "Loading..." } };
export const Error: Story = { args: { placeholder: "Error state", className: "border-destructive" } };
export const Disabled: Story = { args: { disabled: true, placeholder: "Disabled" } };
export const LongContent: Story = { args: { defaultValue: "This is a very long input value that extends beyond the visible area of the input field" } };

