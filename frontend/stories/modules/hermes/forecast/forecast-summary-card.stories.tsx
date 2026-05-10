import type { Meta, StoryObj } from "@storybook/react";
import { ForecastSummaryCard } from "@/modules/forecast/components/forecast-summary-card";
import { ToolLoadingCard } from "@/modules/hermes/tool-ui/cards/tool-loading-card";
import { ToolErrorCard } from "@/modules/hermes/tool-ui/cards/tool-error-card";
import { mapToolResultToViewModel } from "@/modules/hermes/tool-ui/registry";
import { storySeeds } from "@/modules/hermes/dev/story-seeds";

const model = mapToolResultToViewModel(
  "forecast.summary",
  storySeeds.forecast.summary
);

const item =
  model.kind === "forecast.summary" ? model.item : null;

const meta: Meta<typeof ForecastSummaryCard> = {
  title: "Modules/Hermes/Forecast/ForecastSummaryCard",
  component: ForecastSummaryCard,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof ForecastSummaryCard>;

export const Default: Story = {
  args: item ? { item } : {},
};

export const Loading: Story = {
  render: () => <ToolLoadingCard title="Forecast Summary" />,
};

export const Error: Story = {
  render: () => <ToolErrorCard title="Forecast Summary" message="Failed to load forecast data" />,
};

export const Empty: Story = {
  args: {
    item: { period: "", cashIn: 0, cashOut: 0, endingCash: 0 },
  },
};
