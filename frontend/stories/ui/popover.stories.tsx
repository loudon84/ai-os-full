import type { Meta, StoryObj } from "@storybook/react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";

const meta: Meta<typeof Popover> = {
  title: "UI/Popover",
  component: Popover,
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;
type Story = StoryObj<typeof Popover>;

export const Default: Story = {
  args: {
    children: (
      <>
        <PopoverTrigger>Open</PopoverTrigger>
        <PopoverContent><p>Popover content</p></PopoverContent>
      </>
    ),
  },
};

export const Empty: Story = {
  args: {
    children: (<><PopoverTrigger>Open</PopoverTrigger><PopoverContent /></>),
  },
};

