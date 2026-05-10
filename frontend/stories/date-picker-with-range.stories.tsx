import type { Meta, StoryObj } from "@storybook/react";
import DatePickerWithRange from "@/components/date-picker-with-range";

const meta: Meta<typeof DatePickerWithRange> = {
  title: "Components/DatePickerWithRange",
  component: DatePickerWithRange,
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;
type Story = StoryObj<typeof DatePickerWithRange>;

export const Default: Story = {
  args: {},
};

