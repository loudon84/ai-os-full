import type { Meta, StoryObj } from "@storybook/react";
import HeaderSearch from "@/components/header-search";

const meta: Meta<typeof HeaderSearch> = {
  title: "Components/HeaderSearch",
  component: HeaderSearch,
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;
type Story = StoryObj<typeof HeaderSearch>;

export const Default: Story = {
  args: {},
};

