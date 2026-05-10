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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CurrencyCell } from "../shared/CurrencyCell";
import { RiskBadge } from "../shared/RiskBadge";
import { StatusPill } from "../shared/StatusPill";
import {
  getAnomalyTypeLabel,
  getAnomalyStatusLabel,
} from "../../services/finance.mappers";
import type { AnomalyItem } from "../../types/finance.types";

type InvoiceAnomalyTableProps = {
  data: AnomalyItem[];
  onStatusUpdate: (id: string, status: string) => void;
  onViewDetail: (id: string) => void;
};

const columns: ColumnDef<AnomalyItem>[] = [
  {
    accessorKey: "documentNumber",
    header: "单据号",
  },
  {
    accessorKey: "submitter",
    header: "提交人",
  },
  {
    accessorKey: "department",
    header: "部门",
  },
  {
    accessorKey: "amount",
    header: "金额",
    cell: ({ row }) => <CurrencyCell value={row.original.amount} compact />,
  },
  {
    accessorKey: "anomalyType",
    header: "异常类型",
    cell: ({ row }) => (
      <span className="text-xs">
        {getAnomalyTypeLabel(row.original.anomalyType)}
      </span>
    ),
  },
  {
    accessorKey: "riskLevel",
    header: "风险等级",
    cell: ({ row }) => <RiskBadge level={row.original.riskLevel} />,
  },
  {
    accessorKey: "reason",
    header: "原因",
    cell: ({ row }) => (
      <span className="max-w-[200px] truncate text-xs" title={row.original.reason}>
        {row.original.reason}
      </span>
    ),
  },
  {
    accessorKey: "status",
    header: "状态",
    cell: ({ row }) => (
      <StatusPill
        status={row.original.status}
        label={getAnomalyStatusLabel(row.original.status)}
      />
    ),
  },
  {
    id: "actions",
    header: "",
  },
];

export function InvoiceAnomalyTable({
  data,
  onStatusUpdate,
  onViewDetail,
}: InvoiceAnomalyTableProps) {
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
        <span className="text-sm text-muted-foreground">共 {data.length} 条</span>
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
                    {cell.column.id === "actions" ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            操作
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => onViewDetail(row.original.id)}
                          >
                            查看详情
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              onStatusUpdate(row.original.id, "confirmed")
                            }
                          >
                            确认
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              onStatusUpdate(row.original.id, "ignored")
                            }
                          >
                            忽略
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              onStatusUpdate(row.original.id, "escalated")
                            }
                          >
                            升级
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
