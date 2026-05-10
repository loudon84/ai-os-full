import type { Meta, StoryObj } from "@storybook/react";
import Radius from "@/components/partials/customizer/radius";

const meta: Meta<typeof Radius> = {
  title: "Partials/Customizer/Radius",
  component: Radius,
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;
type Story = StoryObj<typeof Radius>;

export const Default: Story = {
  args: {},
};

