"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { RiskLevel, CurrencyCode } from "../../types/finance.types";

type ReceivableFilters = {
  client: string;
  region: string;
  owner: string;
  riskLevel: RiskLevel | "";
  aging: string;
  currency: CurrencyCode | "";
};

type ReceivableFilterBarProps = {
  filters: ReceivableFilters;
  onFiltersChange: (patch: Partial<ReceivableFilters>) => void;
};

const riskLevelOptions: { value: RiskLevel; label: string }[] = [
  { value: "high", label: "高风险" },
  { value: "medium", label: "中风险" },
  { value: "low", label: "低风险" },
];

const agingOptions = [
  { value: "0-30", label: "0-30天" },
  { value: "31-60", label: "31-60天" },
  { value: "61-90", label: "61-90天" },
  { value: "90+", label: "90天以上" },
];

const currencyOptions: { value: CurrencyCode; label: string }[] = [
  { value: "CNY", label: "CNY" },
  { value: "USD", label: "USD" },
  { value: "EUR", label: "EUR" },
  { value: "JPY", label: "JPY" },
];

export function ReceivableFilterBar({
  filters,
  onFiltersChange,
}: ReceivableFilterBarProps) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="w-40">
        <label className="mb-1 block text-xs text-muted-foreground">客户</label>
        <Input
          placeholder="搜索客户"
          value={filters.client}
          onChange={(e) => onFiltersChange({ client: e.target.value })}
        />
      </div>

      <div className="w-32">
        <label className="mb-1 block text-xs text-muted-foreground">区域</label>
        <Input
          placeholder="区域"
          value={filters.region}
          onChange={(e) => onFiltersChange({ region: e.target.value })}
        />
      </div>

      <div className="w-32">
        <label className="mb-1 block text-xs text-muted-foreground">负责人</label>
        <Input
          placeholder="负责人"
          value={filters.owner}
          onChange={(e) => onFiltersChange({ owner: e.target.value })}
        />
      </div>

      <div className="w-32">
        <label className="mb-1 block text-xs text-muted-foreground">风险等级</label>
        <Select
          value={filters.riskLevel}
          onValueChange={(v) =>
            onFiltersChange({ riskLevel: v as RiskLevel | "" })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="全部" />
          </SelectTrigger>
          <SelectContent>
            {riskLevelOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="w-32">
        <label className="mb-1 block text-xs text-muted-foreground">账龄</label>
        <Select
          value={filters.aging}
          onValueChange={(v) => onFiltersChange({ aging: v })}
        >
          <SelectTrigger>
            <SelectValue placeholder="全部" />
          </SelectTrigger>
          <SelectContent>
            {agingOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="w-28">
        <label className="mb-1 block text-xs text-muted-foreground">币种</label>
        <Select
          value={filters.currency}
          onValueChange={(v) =>
            onFiltersChange({ currency: v as CurrencyCode | "" })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="全部" />
          </SelectTrigger>
          <SelectContent>
            {currencyOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
