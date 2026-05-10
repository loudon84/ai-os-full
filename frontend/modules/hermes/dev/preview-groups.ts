import type { HermesAgentId } from "../copilot/types";

/** Domain group definition */
export type PreviewDomainGroup = {
  domain: HermesAgentId;
  label: string;
  description: string;
};

/** All domain groups for the preview workbench */
export const PREVIEW_DOMAIN_GROUPS: PreviewDomainGroup[] = [
  { domain: "finance", label: "Finance", description: "财务指标与现金流" },
  { domain: "risk", label: "Risk", description: "风险预警与敞口" },
  { domain: "forecast", label: "Forecast", description: "现金流预测与情景" },
];
