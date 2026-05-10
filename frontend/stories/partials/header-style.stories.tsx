import type { Meta, StoryObj } from "@storybook/react";
import HeaderStyle from "@/components/partials/customizer/header-style";

const meta: Meta<typeof HeaderStyle> = {
  title: "Partials/Customizer/HeaderStyle",
  component: HeaderStyle,
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;
type Story = StoryObj<typeof HeaderStyle>;

export const Default: Story = {
  args: {},
};

