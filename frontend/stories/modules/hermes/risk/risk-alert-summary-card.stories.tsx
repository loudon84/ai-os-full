import type { Meta, StoryObj } from "@storybook/react";
import { RiskAlertSummaryCard } from "@/modules/risk/components/risk-alert-summary-card";
import { ToolLoadingCard } from "@/modules/hermes/tool-ui/cards/tool-loading-card";
import { ToolErrorCard } from "@/modules/hermes/tool-ui/cards/tool-error-card";
import { mapToolResultToViewModel } from "@/modules/hermes/tool-ui/registry";
import { storySeeds } from "@/modules/hermes/dev/story-seeds";

const model = mapToolResultToViewModel(
  "risk.alert.summary",
  storySeeds.risk.alert
);

const item =
  model.kind === "risk.summary"
    ? {
        title: model.title,
        level: model.level,
        topic: model.topic,
        impact: model.impact,
        recommendation: model.recommendation,
      }
    : {
        title: "Risk Alert",
        level: "high" as const,
        topic: "unknown",
        impact: "",
        recommendation: "",
      };

const meta: Meta<typeof RiskAlertSummaryCard> = {
  title: "Modules/Hermes/Risk/RiskAlertSummaryCard",
  component: RiskAlertSummaryCard,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof RiskAlertSummaryCard>;

export const Default: Story = {
  args: { item },
};

export const Loading: Story = {
  render: () => <ToolLoadingCard title="Risk Alert" />,
};

export const Error: Story = {
  render: () => <ToolErrorCard title="Risk Alert" message="Failed to load risk alert data" />,
};

export const Empty: Story = {
  args: {
    item: { title: "", level: "low" as const, topic: "", impact: "", recommendation: "" },
  },
};
