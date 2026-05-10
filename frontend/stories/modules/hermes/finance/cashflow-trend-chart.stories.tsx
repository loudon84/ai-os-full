import type { Meta, StoryObj } from "@storybook/react";
import { CashflowTrendChart } from "@/modules/finance/components/cashflow-trend-chart";
import { ToolLoadingCard } from "@/modules/hermes/tool-ui/cards/tool-loading-card";
import { ToolErrorCard } from "@/modules/hermes/tool-ui/cards/tool-error-card";
import { mapToolResultToViewModel } from "@/modules/hermes/tool-ui/registry";
import { storySeeds } from "@/modules/hermes/dev/story-seeds";

const model = mapToolResultToViewModel(
  "finance.cashflow.trend",
  storySeeds.finance.cashflowTrend
);

const data =
  model.kind === "finance.cashflow-trend" ? model.data : [];

const meta: Meta<typeof CashflowTrendChart> = {
  title: "Modules/Hermes/Finance/CashflowTrendChart",
  component: CashflowTrendChart,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof CashflowTrendChart>;

export const Default: Story = {
  args: {
    title: "Cashflow Trend",
    data,
  },
};

export const Loading: Story = {
  render: () => <ToolLoadingCard title="Cashflow Trend" />,
};

export const Error: Story = {
  render: () => <ToolErrorCard title="Cashflow Trend" message="Failed to load cashflow data" />,
};

export const Empty: Story = {
  args: {
    title: "Cashflow Trend",
    data: [],
  },
};
