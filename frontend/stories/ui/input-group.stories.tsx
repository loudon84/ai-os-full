import type { Meta, StoryObj } from "@storybook/react";
import { InputGroup } from "@/components/ui/input-group";
import { Input } from "@/components/ui/input";

const meta: Meta<typeof InputGroup> = {
  title: "UI/InputGroup",
  component: InputGroup,
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;
type Story = StoryObj<typeof InputGroup>;

export const Default: Story = {
  args: {
    children: <Input placeholder="Search..." />,
  },
};

export const Empty: Story = { args: { children: <Input placeholder="Empty" value="" /> } };
export const Loading: Story = { args: { children: <Input placeholder="Loading..." disabled /> } };

