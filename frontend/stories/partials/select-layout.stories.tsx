import type { Meta, StoryObj } from "@storybook/react";
import SelectLayout from "@/components/partials/customizer/select-layout";

const meta: Meta<typeof SelectLayout> = {
  title: "Partials/Customizer/SelectLayout",
  component: SelectLayout,
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;
type Story = StoryObj<typeof SelectLayout>;

export const Default: Story = {
  args: {},
};

