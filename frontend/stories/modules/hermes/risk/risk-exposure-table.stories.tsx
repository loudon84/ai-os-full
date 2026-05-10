import type { Meta, StoryObj } from "@storybook/react";
import { RiskExposureTable } from "@/modules/risk/components/risk-exposure-table";
import { ToolLoadingCard } from "@/modules/hermes/tool-ui/cards/tool-loading-card";
import { ToolErrorCard } from "@/modules/hermes/tool-ui/cards/tool-error-card";
import { mapToolResultToViewModel } from "@/modules/hermes/tool-ui/registry";
import { storySeeds } from "@/modules/hermes/dev/story-seeds";

const model = mapToolResultToViewModel(
  "risk.exposure.table",
  storySeeds.risk.exposure
);

const rows =
  model.kind === "risk.exposure-table" ? model.rows : [];

const meta: Meta<typeof RiskExposureTable> = {
  title: "Modules/Hermes/Risk/RiskExposureTable",
  component: RiskExposureTable,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof RiskExposureTable>;

export const Default: Story = {
  args: {
    title: "Risk Exposure",
    rows,
  },
};

export const Loading: Story = {
  render: () => <ToolLoadingCard title="Risk Exposure" />,
};

export const Error: Story = {
  render: () => <ToolErrorCard title="Risk Exposure" message="Failed to load exposure data" />,
};

export const Empty: Story = {
  args: {
    title: "Risk Exposure",
    rows: [],
  },
};
