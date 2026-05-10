import type { Meta, StoryObj } from "@storybook/react";
import { Rating } from "@/components/ui/rating";

const meta: Meta<typeof Rating> = {
  title: "UI/Rating",
  component: Rating,
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;
type Story = StoryObj<typeof Rating>;

export const Default: Story = {
  args: {
    value: 3, total: 5,
  },
};

export const Empty: Story = { args: { value: 0, total: 5 } };
export const Full: Story = { args: { value: 5, total: 5 } };

