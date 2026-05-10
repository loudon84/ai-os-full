import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "@/components/ui/button";

const meta: Meta<typeof Button> = {
  title: "UI/Button",
  component: Button,
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Default: Story = {
  args: {
    children: "Button",
  },
};

export const Empty: Story = { args: { children: "" } };

export const Loading: Story = {
  args: { disabled: true, children: (<><span className="animate-spin mr-2">⏳</span>Loading...</>) },
};

export const Error: Story = { args: { color: "destructive", children: "Error" } };

export const Primary: Story = { args: { color: "primary", children: "Primary" } };
export const Secondary: Story = { args: { color: "secondary", children: "Secondary" } };
export const Destructive: Story = { args: { color: "destructive", children: "Destructive" } };
export const Success: Story = { args: { color: "success", children: "Success" } };
export const Outline: Story = { args: { variant: "outline", children: "Outline" } };
export const Ghost: Story = { args: { variant: "ghost", children: "Ghost" } };
export const Soft: Story = { args: { variant: "soft", children: "Soft" } };
export const Small: Story = { args: { size: "sm", children: "Small" } };
export const Large: Story = { args: { size: "lg", children: "Large" } };
export const Disabled: Story = { args: { disabled: true, children: "Disabled" } };
export const LongContent: Story = { args: { children: "Very Long Button Text Content" } };

