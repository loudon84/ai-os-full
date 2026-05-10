import type { Meta, StoryObj } from "@storybook/react";
import VerifyForm from "@/components/auth/verify-form";

const meta: Meta<typeof VerifyForm> = {
  title: "Auth/VerifyForm",
  component: VerifyForm,
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;
type Story = StoryObj<typeof VerifyForm>;

export const Default: Story = {
  args: {},
};

