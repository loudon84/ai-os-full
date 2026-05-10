"use client";

import { useState } from "react";
import { useHermesSessions } from "../../hooks/useHermesSessions";
import { SessionStatusBadge } from "./SessionStatusBadge";
import { HermesEmptyState } from "../shared/HermesEmptyState";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { SessionStatus, HermesSession } from "../../types/hermes.types";

export function SessionsTable() {
  const [statusFilter, setStatusFilter] = useState<SessionStatus | "all">("all");
  const [page, setPage] = useState(1);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const pageSize = 10;

  const { sessions, total, query } = useHermesSessions({
    status: statusFilter === "all" ? undefined : statusFilter,
    page,
    pageSize,
    sortBy: "updatedAt",
    sortOrder,
  });

  const totalPages = Math.ceil(total / pageSize);

  return (
    <Card>
      <CardContent className="p-4">
        {/* Filter bar */}
        <div className="mb-4 flex items-center gap-3">
          <Select
            value={statusFilter}
            onValueChange={(v) => { setStatusFilter(v as SessionStatus | "all"); setPage(1); }}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="idle">Idle</SelectItem>
              <SelectItem value="running">Running</SelectItem>
              <SelectItem value="error">Error</SelectItem>
              <SelectItem value="done">Done</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
          >
            Updated {sortOrder === "desc" ? "↓" : "↑"}
          </Button>
        </div>

        {/* Table */}
        {query.isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-10 rounded bg-muted/50 animate-pulse" />
            ))}
          </div>
        ) : sessions.length === 0 ? (
          <HermesEmptyState message="No sessions found" />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Messages</TableHead>
                  <TableHead className="text-right">Tool Calls</TableHead>
                  <TableHead className="text-right">Tokens</TableHead>
                  <TableHead>Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-mono text-xs">{s.id}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{s.title || "—"}</TableCell>
                    <TableCell><SessionStatusBadge status={s.status} /></TableCell>
                    <TableCell className="text-right">{s.messageCount}</TableCell>
                    <TableCell className="text-right">{s.toolCallCount}</TableCell>
                    <TableCell className="text-right">{s.totalTokens.toLocaleString()}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{formatRelativeTime(s.updatedAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Page {page} of {totalPages} ({total} total)
                </p>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage(page - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage(page + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function formatRelativeTime(isoDate: string): string {
  const now = Date.now();
  const then = new Date(isoDate).getTime();
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60_000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}
