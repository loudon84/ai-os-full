import type { Meta, StoryObj } from "@storybook/react";
import { AgingTable } from "@/modules/finance/components/aging-table";
import { ToolLoadingCard } from "@/modules/hermes/tool-ui/cards/tool-loading-card";
import { ToolErrorCard } from "@/modules/hermes/tool-ui/cards/tool-error-card";
import { mapToolResultToViewModel } from "@/modules/hermes/tool-ui/registry";
import { storySeeds } from "@/modules/hermes/dev/story-seeds";

const model = mapToolResultToViewModel(
  "finance.receivable.aging",
  storySeeds.finance.receivableAging
);

const rows =
  model.kind === "finance.aging-table" ? model.rows : [];

const meta: Meta<typeof AgingTable> = {
  title: "Modules/Hermes/Finance/AgingTable",
  component: AgingTable,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof AgingTable>;

export const Default: Story = {
  args: {
    rows,
  },
};

export const Loading: Story = {
  render: () => <ToolLoadingCard title="Receivable Aging" />,
};

export const Error: Story = {
  render: () => <ToolErrorCard title="Receivable Aging" message="Failed to load aging data" />,
};

export const Empty: Story = {
  args: {
    rows: [],
  },
};
