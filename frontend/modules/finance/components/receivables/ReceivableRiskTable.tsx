"use client";

import { useState } from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CurrencyCell } from "../shared/CurrencyCell";
import { RiskBadge } from "../shared/RiskBadge";
import { getRecommendedActionLabel } from "../../services/finance.mappers";
import type { ReceivableRiskItem } from "../../types/finance.types";

type ReceivableRiskTableProps = {
  data: ReceivableRiskItem[];
  onViewDetail?: (clientId: string) => void;
};

const columns: ColumnDef<ReceivableRiskItem>[] = [
  {
    accessorKey: "clientName",
    header: "客户名称",
  },
  {
    accessorKey: "receivableBalance",
    header: "应收余额",
    cell: ({ row }) => (
      <CurrencyCell value={row.original.receivableBalance} compact />
    ),
  },
  {
    accessorKey: "overdueAmount",
    header: "逾期金额",
    cell: ({ row }) => (
      <CurrencyCell value={row.original.overdueAmount} compact />
    ),
  },
  {
    accessorKey: "maxOverdueDays",
    header: "最大逾期天数",
  },
  {
    accessorKey: "riskLevel",
    header: "风险等级",
    cell: ({ row }) => <RiskBadge level={row.original.riskLevel} />,
  },
  {
    accessorKey: "riskReasons",
    header: "风险原因",
    cell: ({ row }) => (
      <span className="text-xs">{row.original.riskReasons.join("、")}</span>
    ),
  },
  {
    accessorKey: "recommendedAction",
    header: "建议操作",
    cell: ({ row }) => (
      <span className="text-xs">
        {getRecommendedActionLabel(row.original.recommendedAction)}
      </span>
    ),
  },
  {
    id: "detail",
    header: "",
    cell: ({ row }) => row.original.clientId,
  },
];

export function ReceivableRiskTable({
  data,
  onViewDetail,
}: ReceivableRiskTableProps) {
  const [globalFilter, setGlobalFilter] = useState("");

  const table = useReactTable({
    data,
    columns,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <Input
          placeholder="搜索..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-xs"
        />
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>共 {data.length} 条</span>
        </div>
      </div>

      {/* Table */}
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {cell.column.id === "detail" ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewDetail?.(cell.getValue() as string)}
                      >
                        详情
                      </Button>
                    ) : (
                      flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )
                    )}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="h-24 text-center text-muted-foreground"
              >
                暂无数据
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Pagination */}
      <div className="flex items-center justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          上一页
        </Button>
        <span className="text-sm text-muted-foreground">
          第 {table.getState().pagination.pageIndex + 1} /{" "}
          {table.getPageCount()} 页
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          下一页
        </Button>
      </div>
    </div>
  );
}
