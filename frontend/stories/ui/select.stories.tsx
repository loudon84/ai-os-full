import type { Meta, StoryObj } from "@storybook/react";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";

const meta: Meta<typeof Select> = {
  title: "UI/Select",
  component: Select,
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;
type Story = StoryObj<typeof Select>;

export const Default: Story = {
  args: {
    children: (
      <>
        <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
        <SelectContent>
          <SelectItem value="option1">Option 1</SelectItem>
          <SelectItem value="option2">Option 2</SelectItem>
          <SelectItem value="option3">Option 3</SelectItem>
        </SelectContent>
      </>
    ),
  },
};

export const Empty: Story = {
  args: {
    children: (<><SelectTrigger><SelectValue placeholder="No options" /></SelectTrigger><SelectContent /></>),
  },
};

