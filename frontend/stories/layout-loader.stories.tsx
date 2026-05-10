import type { Meta, StoryObj } from "@storybook/react";
import LayoutLoader from "@/components/layout-loader";

const meta: Meta<typeof LayoutLoader> = {
  title: "Components/LayoutLoader",
  component: LayoutLoader,
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;
type Story = StoryObj<typeof LayoutLoader>;

export const Default: Story = {
  args: {},
};

export const Loading: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: "Full page loading state.",
      },
    },
  },
};

