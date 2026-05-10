import type { Meta, StoryObj } from "@storybook/react";
import { ScenarioComparisonTable } from "@/modules/forecast/components/scenario-comparison-table";
import { ToolLoadingCard } from "@/modules/hermes/tool-ui/cards/tool-loading-card";
import { ToolErrorCard } from "@/modules/hermes/tool-ui/cards/tool-error-card";
import { mapToolResultToViewModel } from "@/modules/hermes/tool-ui/registry";
import { storySeeds } from "@/modules/hermes/dev/story-seeds";

const model = mapToolResultToViewModel(
  "forecast.scenario.comparison",
  storySeeds.forecast.scenarioComparison
);

const rows =
  model.kind === "forecast.scenario-comparison" ? model.rows : [];

const meta: Meta<typeof ScenarioComparisonTable> = {
  title: "Modules/Hermes/Forecast/ScenarioComparisonTable",
  component: ScenarioComparisonTable,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof ScenarioComparisonTable>;

export const Default: Story = {
  args: {
    title: "Scenario Comparison",
    rows,
  },
};

export const Loading: Story = {
  render: () => <ToolLoadingCard title="Scenario Comparison" />,
};

export const Error: Story = {
  render: () => <ToolErrorCard title="Scenario Comparison" message="Failed to load scenario data" />,
};

export const Empty: Story = {
  args: {
    title: "Scenario Comparison",
    rows: [],
  },
};
