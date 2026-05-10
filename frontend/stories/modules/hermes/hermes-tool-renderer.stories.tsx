import type { Meta, StoryObj } from "@storybook/react";
import { HermesToolRenderer } from "@/modules/hermes/components/copilot/hermes-tool-renderer";
import { ToolLoadingCard } from "@/modules/hermes/tool-ui/cards/tool-loading-card";
import { ToolErrorCard } from "@/modules/hermes/tool-ui/cards/tool-error-card";
import { storySeeds } from "@/modules/hermes/dev/story-seeds";

const meta: Meta<typeof HermesToolRenderer> = {
  title: "Modules/Hermes/HermesToolRenderer",
  component: HermesToolRenderer,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof HermesToolRenderer>;

// Finance stories
export const FinanceKpiSummary: Story = {
  args: {
    toolName: "finance.kpi.summary",
    data: storySeeds.finance.kpi,
  },
};

export const FinanceReceivableAging: Story = {
  args: {
    toolName: "finance.receivable.aging",
    data: storySeeds.finance.receivableAging,
  },
};

export const FinanceCashflowTrend: Story = {
  args: {
    toolName: "finance.cashflow.trend",
    data: storySeeds.finance.cashflowTrend,
  },
};

export const FinanceReceivableStatus: Story = {
  args: {
    toolName: "finance.receivable.status",
    data: storySeeds.finance.receivableStatus,
  },
};

// Risk stories
export const RiskAlertSummary: Story = {
  args: {
    toolName: "risk.alert.summary",
    data: storySeeds.risk.alert,
  },
};

export const RiskExposureTable: Story = {
  args: {
    toolName: "risk.exposure.table",
    data: storySeeds.risk.exposure,
  },
};

export const RiskOverdueCustomerList: Story = {
  args: {
    toolName: "risk.overdue.customer-list",
    data: storySeeds.risk.overdueCustomerList,
  },
};

export const RiskCreditLimitUsage: Story = {
  args: {
    toolName: "risk.credit.limit-usage",
    data: storySeeds.risk.creditLimitUsage,
  },
};

// Forecast stories
export const ForecastSummary: Story = {
  args: {
    toolName: "forecast.summary",
    data: storySeeds.forecast.summary,
  },
};

export const ForecastLiquidityWarning: Story = {
  args: {
    toolName: "forecast.liquidity.warning",
    data: storySeeds.forecast.liquidityWarning,
  },
};

export const ForecastCashflowTrend: Story = {
  args: {
    toolName: "forecast.cashflow.trend",
    data: storySeeds.forecast.cashflowTrend,
  },
};

export const ForecastScenarioComparison: Story = {
  args: {
    toolName: "forecast.scenario.comparison",
    data: storySeeds.forecast.scenarioComparison,
  },
};

// Boundary state stories
export const Loading: Story = {
  render: () => <ToolLoadingCard title="Loading Tool Result" />,
};

export const Error: Story = {
  render: () => <ToolErrorCard title="Tool Error" message="Failed to fetch tool result from Hermes Gateway" />,
};
