"use client";

import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CurrencyCell } from "../shared/CurrencyCell";
import type { ForecastFactor, CashflowForecastData } from "../../types/finance.types";

type ForecastFactorTableProps = {
  factors: CashflowForecastData["factors"];
};

type FactorCategory = {
  key: string;
  label: string;
  data: ForecastFactor[];
};

function FactorSimpleTable({ data }: { data: ForecastFactor[] }) {
  if (data.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-muted-foreground">暂无数据</p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>名称</TableHead>
          <TableHead>金额</TableHead>
          <TableHead>影响</TableHead>
          <TableHead>到期日</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((item, index) => (
          <TableRow key={`${item.name}-${index}`}>
            <TableCell>{item.name}</TableCell>
            <TableCell>
              <CurrencyCell value={item.amount} compact />
            </TableCell>
            <TableCell>
              <span
                className={
                  item.impact === "positive"
                    ? "text-emerald-500"
                    : "text-red-500"
                }
              >
                {item.impact === "positive" ? "正向" : "负向"}
              </span>
            </TableCell>
            <TableCell>{item.dueDate}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function ForecastFactorTable({ factors }: ForecastFactorTableProps) {
  const categories: FactorCategory[] = [
    { key: "clients", label: "客户", data: factors.clients },
    { key: "suppliers", label: "供应商", data: factors.suppliers },
    { key: "largePayments", label: "大额付款", data: factors.largePayments },
    { key: "largeReceipts", label: "大额收款", data: factors.largeReceipts },
  ];

  return (
    <Tabs defaultValue="clients">
      <TabsList>
        {categories.map((cat) => (
          <TabsTrigger key={cat.key} value={cat.key}>
            {cat.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {categories.map((cat) => (
        <TabsContent key={cat.key} value={cat.key}>
          <FactorSimpleTable data={cat.data} />
        </TabsContent>
      ))}
    </Tabs>
  );
}
