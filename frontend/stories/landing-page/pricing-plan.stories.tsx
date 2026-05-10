import type { Meta, StoryObj } from "@storybook/react";
import PricingPlan from "@/components/landing-page/pricing-plan";

const meta: Meta<typeof PricingPlan> = {
  title: "LandingPage/PricingPlan",
  component: PricingPlan,
  tags: ["autodocs"],
  argTypes: {},
};

export default meta;
type Story = StoryObj<typeof PricingPlan>;

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

