"use client";

import { Button } from "@/components/ui/button";
import type { ForecastPeriod, ForecastScenario } from "../../types/finance.types";

type ForecastScenarioTabsProps = {
  period: ForecastPeriod;
  onPeriodChange: (period: ForecastPeriod) => void;
  scenario: ForecastScenario;
  onScenarioChange: (scenario: ForecastScenario) => void;
};

const periodOptions: { value: ForecastPeriod; label: string }[] = [
  { value: 30, label: "30天" },
  { value: 60, label: "60天" },
  { value: 90, label: "90天" },
];

const scenarioOptions: { value: ForecastScenario; label: string }[] = [
  { value: "optimistic", label: "乐观" },
  { value: "baseline", label: "基准" },
  { value: "pessimistic", label: "悲观" },
];

export function ForecastScenarioTabs({
  period,
  onPeriodChange,
  scenario,
  onScenarioChange,
}: ForecastScenarioTabsProps) {
  return (
    <div className="flex flex-wrap items-center gap-4">
      {/* Period toggle */}
      <div className="flex items-center gap-1">
        <span className="text-sm text-muted-foreground mr-1">预测周期</span>
        {periodOptions.map((opt) => (
          <Button
            key={opt.value}
            color={period === opt.value ? "primary" : "default"}
            variant={period === opt.value ? undefined : "outline"}
            size="sm"
            onClick={() => onPeriodChange(opt.value)}
          >
            {opt.label}
          </Button>
        ))}
      </div>

      {/* Scenario toggle */}
      <div className="flex items-center gap-1">
        <span className="text-sm text-muted-foreground mr-1">情景</span>
        {scenarioOptions.map((opt) => (
          <Button
            key={opt.value}
            color={scenario === opt.value ? "primary" : "default"}
            variant={scenario === opt.value ? undefined : "outline"}
            size="sm"
            onClick={() => onScenarioChange(opt.value)}
          >
            {opt.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
