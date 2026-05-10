/**
 * HermesToolRenderer - Routes tool results to specialized UI cards
 * using registry + adapter pattern:
 *   toolName + data → resolveToolPayload → mapToolResultToViewModel → Adapter → Domain component
 */
"use client";

import { mapToolResultToViewModel } from "../../tool-ui/registry";
import { FinanceToolUiAdapter } from "../../tool-ui/adapters/finance-tool-ui-adapter";
import { RiskToolUiAdapter } from "../../tool-ui/adapters/risk-tool-ui-adapter";
import { ForecastToolUiAdapter } from "../../tool-ui/adapters/forecast-tool-ui-adapter";
import { GenericJsonCard } from "../../tool-ui/cards/generic-json-card";
import { ToolErrorCard } from "../../tool-ui/cards/tool-error-card";
import { useDashboardCardInjection } from "../../hooks/use-dashboard-card-injection";

type HermesToolRendererProps = {
  toolName?: string;
  data?: unknown;
};

export function HermesToolRenderer({
  toolName,
  data,
}: HermesToolRendererProps) {
  const { injectToolCardContext } = useDashboardCardInjection();

  if (!toolName) {
    return <GenericJsonCard data={data} />;
  }

  const model = mapToolResultToViewModel(toolName, data);

  if (model.kind.startsWith("finance.")) {
    return (
      <FinanceToolUiAdapter
        model={model}
        onInjectContext={injectToolCardContext}
      />
    );
  }

  if (model.kind === "risk.summary") {
    return (
      <RiskToolUiAdapter
        model={model}
        onInjectContext={injectToolCardContext}
      />
    );
  }

  if (model.kind === "forecast.summary") {
    return (
      <ForecastToolUiAdapter
        model={model}
        onInjectContext={injectToolCardContext}
      />
    );
  }

  if (model.kind === "generic.error") {
    return <ToolErrorCard title={model.title} message={model.message} />;
  }

  if (model.kind === "generic.json") {
    return <GenericJsonCard title={model.title ?? toolName} data={model.data} />;
  }

  return <GenericJsonCard title={toolName} data={data} />;
}
