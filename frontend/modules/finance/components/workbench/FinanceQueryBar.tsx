"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type FinanceQueryBarProps = {
  onRun: (query: string) => void;
  onStop: () => void;
  isRunning: boolean;
};

const quickChips = [
  "应收风险分析",
  "现金流预测",
  "异常发票检查",
  "逾期客户列表",
];

export function FinanceQueryBar({
  onRun,
  onStop,
  isRunning,
}: FinanceQueryBarProps) {
  const [query, setQuery] = useState("");

  const handleRun = () => {
    if (!query.trim()) return;
    onRun(query.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isRunning) {
      handleRun();
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          placeholder="输入分析查询，例如：分析近30天应收风险..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isRunning}
          className="flex-1"
        />
        {isRunning ? (
          <Button color="destructive" onClick={onStop}>
            停止
          </Button>
        ) : (
          <Button onClick={handleRun} disabled={!query.trim()}>
            运行
          </Button>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {quickChips.map((chip) => (
          <Button
            key={chip}
            variant="outline"
            size="sm"
            onClick={() => {
              setQuery(chip);
              onRun(chip);
            }}
            disabled={isRunning}
            className="text-xs"
          >
            {chip}
          </Button>
        ))}
      </div>
    </div>
  );
}
