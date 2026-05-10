import type { Meta, StoryObj } from "@storybook/react";
import RtlSwitch from "@/components/partials/customizer/rtl-switch";

const meta: Meta<typeof RtlSwitch> = {
  title: "Partials/Customizer/RtlSwitch",
  component: RtlSwitch,
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;
type Story = StoryObj<typeof RtlSwitch>;

export const Default: Story = {
  args: {},
};

