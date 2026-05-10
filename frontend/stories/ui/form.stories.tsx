import type { Meta, StoryObj } from "@storybook/react";
import { Form } from "@/components/ui/form";

const meta: Meta<typeof Form> = {
  title: "UI/Form",
  component: Form,
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;
type Story = StoryObj<typeof Form>;

export const Default: Story = {
  args: {
    
  },
};

