import type { Meta, StoryObj } from "@storybook/react";
import { OverdueCustomerListCard } from "@/modules/risk/components/overdue-customer-list-card";
import { ToolLoadingCard } from "@/modules/hermes/tool-ui/cards/tool-loading-card";
import { ToolErrorCard } from "@/modules/hermes/tool-ui/cards/tool-error-card";
import { mapToolResultToViewModel } from "@/modules/hermes/tool-ui/registry";
import { storySeeds } from "@/modules/hermes/dev/story-seeds";

const model = mapToolResultToViewModel(
  "risk.overdue.customer-list",
  storySeeds.risk.overdueCustomerList
);

const rows =
  model.kind === "risk.overdue-customer-list" ? model.rows : [];

const meta: Meta<typeof OverdueCustomerListCard> = {
  title: "Modules/Hermes/Risk/OverdueCustomerListCard",
  component: OverdueCustomerListCard,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof OverdueCustomerListCard>;

export const Default: Story = {
  args: {
    title: "Overdue Customers",
    rows,
  },
};

export const Loading: Story = {
  render: () => <ToolLoadingCard title="Overdue Customers" />,
};

export const Error: Story = {
  render: () => <ToolErrorCard title="Overdue Customers" message="Failed to load overdue data" />,
};

export const Empty: Story = {
  args: {
    title: "Overdue Customers",
    rows: [],
  },
};
