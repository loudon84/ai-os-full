import type { Meta, StoryObj } from "@storybook/react";
import DashboardDropdown from "@/components/dashboard-dropdown";

const meta: Meta<typeof DashboardDropdown> = {
  title: "Components/DashboardDropdown",
  component: DashboardDropdown,
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;
type Story = StoryObj<typeof DashboardDropdown>;

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

