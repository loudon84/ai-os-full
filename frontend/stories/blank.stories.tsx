import type { Meta, StoryObj } from "@storybook/react";
import Blank from "@/components/blank";

const meta: Meta<typeof Blank> = {
  title: "Components/Blank",
  component: Blank,
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;
type Story = StoryObj<typeof Blank>;

export const Default: Story = {
  args: {},
};

