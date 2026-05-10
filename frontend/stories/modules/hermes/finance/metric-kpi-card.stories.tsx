import type { Meta, StoryObj } from "@storybook/react";
import { MetricKpiCard } from "@/modules/finance/components/metric-kpi-card";
import { ToolLoadingCard } from "@/modules/hermes/tool-ui/cards/tool-loading-card";
import { ToolErrorCard } from "@/modules/hermes/tool-ui/cards/tool-error-card";
import { mapToolResultToViewModel } from "@/modules/hermes/tool-ui/registry";
import { storySeeds } from "@/modules/hermes/dev/story-seeds";

const model = mapToolResultToViewModel(
  "finance.kpi.summary",
  storySeeds.finance.kpi
);

const items =
  model.kind === "finance.kpi-list" ? model.items : [];

const meta: Meta<typeof MetricKpiCard> = {
  title: "Modules/Hermes/Finance/MetricKpiCard",
  component: MetricKpiCard,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof MetricKpiCard>;

export const Default: Story = {
  args: {
    item: items[0],
  },
};

export const AllKpis: Story = {
  render: () => (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
      {items.map((item) => (
        <MetricKpiCard key={item.key} item={item} />
      ))}
    </div>
  ),
};

export const Loading: Story = {
  render: () => <ToolLoadingCard title="Metric KPI" />,
};

export const Error: Story = {
  render: () => <ToolErrorCard title="Metric KPI" message="Failed to load KPI data" />,
};

export const Empty: Story = {
  args: {
    item: { key: "", label: "", value: 0, trend: "", hint: "" },
  },
};
