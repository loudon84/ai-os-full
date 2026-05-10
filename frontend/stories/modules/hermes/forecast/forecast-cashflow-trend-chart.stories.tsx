import type { Meta, StoryObj } from "@storybook/react";
import { ForecastCashflowTrendChart } from "@/modules/forecast/components/forecast-cashflow-trend-chart";
import { ToolLoadingCard } from "@/modules/hermes/tool-ui/cards/tool-loading-card";
import { ToolErrorCard } from "@/modules/hermes/tool-ui/cards/tool-error-card";
import { mapToolResultToViewModel } from "@/modules/hermes/tool-ui/registry";
import { storySeeds } from "@/modules/hermes/dev/story-seeds";

const model = mapToolResultToViewModel(
  "forecast.cashflow.trend",
  storySeeds.forecast.cashflowTrend
);

const data =
  model.kind === "forecast.cashflow-trend" ? model.data : [];

const meta: Meta<typeof ForecastCashflowTrendChart> = {
  title: "Modules/Hermes/Forecast/ForecastCashflowTrendChart",
  component: ForecastCashflowTrendChart,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof ForecastCashflowTrendChart>;

export const Default: Story = {
  args: {
    title: "Forecast Cashflow Trend",
    data,
  },
};

export const Loading: Story = {
  render: () => <ToolLoadingCard title="Forecast Cashflow Trend" />,
};

export const Error: Story = {
  render: () => <ToolErrorCard title="Forecast Cashflow Trend" message="Failed to load forecast cashflow data" />,
};

export const Empty: Story = {
  args: {
    title: "Forecast Cashflow Trend",
    data: [],
  },
};
