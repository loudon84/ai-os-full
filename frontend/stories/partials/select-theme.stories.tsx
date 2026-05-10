import type { Meta, StoryObj } from "@storybook/react";
import SelectTheme from "@/components/partials/customizer/select-theme";

const meta: Meta<typeof SelectTheme> = {
  title: "Partials/Customizer/SelectTheme",
  component: SelectTheme,
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;
type Story = StoryObj<typeof SelectTheme>;

export const Default: Story = {
  args: {},
};

