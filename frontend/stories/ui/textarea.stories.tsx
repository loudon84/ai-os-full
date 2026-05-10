import type { Meta, StoryObj } from "@storybook/react";
import { Textarea } from "@/components/ui/textarea";

const meta: Meta<typeof Textarea> = {
  title: "UI/Textarea",
  component: Textarea,
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;
type Story = StoryObj<typeof Textarea>;

export const Default: Story = {
  args: {
    placeholder: "Type your message here...",
  },
};

export const Empty: Story = { args: { placeholder: "Empty", value: "" } };
export const Loading: Story = { args: { placeholder: "Loading...", disabled: true } };
export const Error: Story = { args: { placeholder: "Error state", className: "border-destructive" } };
export const Disabled: Story = { args: { disabled: true, placeholder: "Disabled" } };
export const LongContent: Story = { args: { defaultValue: "This is a very long textarea value.\n".repeat(10) } };

