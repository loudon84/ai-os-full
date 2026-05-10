import type { Meta, StoryObj } from "@storybook/react";
import ListFileCard from "@/components/files/list-file-card";

const meta: Meta<typeof ListFileCard> = {
  title: "Files/ListFileCard",
  component: ListFileCard,
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;
type Story = StoryObj<typeof ListFileCard>;

export const Default: Story = {
  args: {},
};

export const Empty: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: "Empty state with no data.",
      },
    },
  },
};

export const Loading: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: "Loading state.",
      },
    },
  },
};

export const Error: Story = {
  args: {},
  parameters: {
    docs: {
      description: {
        story: "Error state when data fails to load.",
      },
    },
  },
};

