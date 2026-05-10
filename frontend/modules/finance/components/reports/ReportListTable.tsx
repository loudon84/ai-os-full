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
import { StatusPill } from "../shared/StatusPill";
import {
  getReportTypeLabel,
  getReportStatusLabel,
} from "../../services/finance.mappers";
import type { ReportItem } from "../../types/finance.types";

type ReportListTableProps = {
  data: ReportItem[];
  onSelectReport?: (id: string) => void;
};

const columns: ColumnDef<ReportItem>[] = [
  {
    accessorKey: "name",
    header: "报告名称",
  },
  {
    accessorKey: "type",
    header: "类型",
    cell: ({ row }) => (
      <span className="text-xs">{getReportTypeLabel(row.original.type)}</span>
    ),
  },
  {
    accessorKey: "linkedTaskId",
    header: "关联任务",
    cell: ({ row }) => (
      <span className="text-xs">{row.original.linkedTaskId ?? "-"}</span>
    ),
  },
  {
    accessorKey: "createdBy",
    header: "创建人",
  },
  {
    accessorKey: "updatedAt",
    header: "更新时间",
    cell: ({ row }) => (
      <span className="text-xs">{row.original.updatedAt}</span>
    ),
  },
  {
    accessorKey: "status",
    header: "状态",
    cell: ({ row }) => (
      <StatusPill
        status={row.original.status}
        label={getReportStatusLabel(row.original.status)}
      />
    ),
  },
  {
    accessorKey: "currentApprovalNode",
    header: "当前审批节点",
    cell: ({ row }) => (
      <span className="text-xs">
        {row.original.currentApprovalNode ?? "-"}
      </span>
    ),
  },
];

export function ReportListTable({
  data,
  onSelectReport,
}: ReportListTableProps) {
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
              <TableRow
                key={row.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => onSelectReport?.(row.original.id)}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(
                      cell.column.columnDef.cell,
                      cell.getContext()
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
