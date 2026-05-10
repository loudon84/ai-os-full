import type { Meta, StoryObj } from "@storybook/react";
import ErrorBlock from "@/components/error-block";

const meta: Meta<typeof ErrorBlock> = {
  title: "Components/ErrorBlock",
  component: ErrorBlock,
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;
type Story = StoryObj<typeof ErrorBlock>;

export const Default: Story = {
  args: {},
};

export const NotFound: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: "404 Not Found error block.",
      },
    },
  },
};

export const Forbidden: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: "403 Forbidden - Permission denied state.",
      },
    },
  },
};

