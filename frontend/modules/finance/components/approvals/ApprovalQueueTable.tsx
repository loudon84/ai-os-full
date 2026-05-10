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
import { RiskBadge } from "../shared/RiskBadge";
import { getApprovalTypeLabel } from "../../services/finance.mappers";
import type { ApprovalItem } from "../../types/finance.types";

type ApprovalQueueTableProps = {
  data: ApprovalItem[];
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onViewDetail?: (id: string) => void;
};

const columns: ColumnDef<ApprovalItem>[] = [
  {
    accessorKey: "taskName",
    header: "任务名称",
  },
  {
    accessorKey: "type",
    header: "类型",
    cell: ({ row }) => (
      <span className="text-xs">
        {getApprovalTypeLabel(row.original.type)}
      </span>
    ),
  },
  {
    accessorKey: "submitter",
    header: "提交人",
  },
  {
    accessorKey: "submittedAt",
    header: "提交时间",
    cell: ({ row }) => (
      <span className="text-xs">{row.original.submittedAt}</span>
    ),
  },
  {
    accessorKey: "riskLevel",
    header: "风险等级",
    cell: ({ row }) => <RiskBadge level={row.original.riskLevel} />,
  },
  {
    accessorKey: "currentNode",
    header: "当前节点",
  },
  {
    accessorKey: "slaHours",
    header: "SLA(小时)",
    cell: ({ row }) => (
      <span
        className={
          row.original.isSlaWarning
            ? "font-semibold text-red-500"
            : ""
        }
      >
        {row.original.slaHours}
      </span>
    ),
  },
  {
    id: "actions",
    header: "",
  },
];

export function ApprovalQueueTable({
  data,
  onApprove,
  onReject,
  onViewDetail,
}: ApprovalQueueTableProps) {
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
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onViewDetail?.(row.original.id)}
                        >
                          详情
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-emerald-600"
                          onClick={() => onApprove?.(row.original.id)}
                        >
                          通过
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600"
                          onClick={() => onReject?.(row.original.id)}
                        >
                          驳回
                        </Button>
                      </div>
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
