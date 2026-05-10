import type { Meta, StoryObj } from "@storybook/react";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";

const meta: Meta<typeof Tooltip> = {
  title: "UI/Tooltip",
  component: Tooltip,
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;
type Story = StoryObj<typeof Tooltip>;

export const Default: Story = {
  args: {
    children: (
      <TooltipProvider>
        <TooltipTrigger>Hover me</TooltipTrigger>
        <TooltipContent><p>Tooltip content</p></TooltipContent>
      </TooltipProvider>
    ),
  },
};

export const Error: Story = {
  args: {
    children: (
      <TooltipProvider>
        <TooltipTrigger>Error</TooltipTrigger>
        <TooltipContent><p className="text-destructive">Error message</p></TooltipContent>
      </TooltipProvider>
    ),
  },
};

