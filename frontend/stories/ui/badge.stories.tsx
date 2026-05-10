import type { Meta, StoryObj } from "@storybook/react";
import { Badge } from "@/components/ui/badge";

const meta: Meta<typeof Badge> = {
  title: "UI/Badge",
  component: Badge,
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;
type Story = StoryObj<typeof Badge>;

export const Default: Story = {
  args: {
    children: "Badge",
  },
};

export const Empty: Story = { args: { children: "" } };

export const Secondary: Story = { args: { color: "secondary", children: "Secondary" } };
export const Destructive: Story = { args: { color: "destructive", children: "Destructive" } };
export const Success: Story = { args: { color: "success", children: "Success" } };
export const Info: Story = { args: { color: "info", children: "Info" } };
export const Warning: Story = { args: { color: "warning", children: "Warning" } };
export const Outline: Story = { args: { variant: "outline", children: "Outline" } };
export const Soft: Story = { args: { variant: "soft", children: "Soft" } };
export const LongContent: Story = { args: { children: "Very Long Badge Text That Overflows" } };

