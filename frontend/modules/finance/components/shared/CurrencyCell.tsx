import type { Money } from "../../types/finance.types";
import { formatMoney } from "../../services/finance.mappers";

type CurrencyCellProps = {
  value: Money;
  compact?: boolean;
};

export function CurrencyCell({ value, compact }: CurrencyCellProps) {
  return <span className="font-mono">{formatMoney(value, compact)}</span>;
}
