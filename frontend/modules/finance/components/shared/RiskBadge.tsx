import { Badge } from "@/components/ui/badge";
import type { RiskLevel } from "../../types/finance.types";
import {
  getRiskLevelLabel,
  getRiskLevelVariant,
} from "../../services/finance.mappers";

type RiskBadgeProps = {
  level: RiskLevel;
};

/** Maps risk level to badge color: high → destructive, medium → warning, low → secondary */
function resolveBadgeColor(
  level: RiskLevel
): "destructive" | "warning" | "secondary" {
  const variant = getRiskLevelVariant(level);
  // The Badge component supports "warning" as a color, so we can use it directly
  return variant;
}

export function RiskBadge({ level }: RiskBadgeProps) {
  return <Badge color={resolveBadgeColor(level)}>{getRiskLevelLabel(level)}</Badge>;
}
