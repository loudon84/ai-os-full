"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

import { DocumentCreateDialog } from "../components/DocumentCreateDialog";
import { DocumentStatusBadge } from "../components/DocumentStatusBadge";
import { DocumentModuleShell } from "../components/layout/DocumentModuleShell";
import { useDocumentCreate } from "../hooks/useDocumentCreate";
import { useDocuments } from "../hooks/useDocuments";

export default function DocumentListPage() {
  const params = useParams<{ lang?: string }>();
  const lang = typeof params?.lang === "string" ? params.lang : "";
  const docHref = (documentId: string) => (lang ? `/${lang}/documents/${documentId}` : `/documents/${documentId}`);

  const [keyword, setKeyword] = useState("");
  const listQuery = useDocuments({ keyword });
  const createMutation = useDocumentCreate();

  const items = useMemo(() => listQuery.data?.items ?? [], [listQuery.data]);

  return (
    <DocumentModuleShell title="文档">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="搜索文档标题"
            className="w-full sm:w-[320px]"
          />
          <Button variant="outline" size="sm" onClick={() => listQuery.refetch()}>
            刷新
          </Button>
        </div>
        <DocumentCreateDialog
          disabled={createMutation.isPending}
          onCreate={(title) => createMutation.mutate({ title })}
        />
      </div>

      {listQuery.isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-56 w-full" />
        </div>
      )}

      {listQuery.isError && (
        <div className="space-y-2">
          <div className="text-sm text-destructive">加载失败，请稍后重试</div>
          <Button variant="outline" size="sm" onClick={() => listQuery.refetch()}>
            重试
          </Button>
        </div>
      )}

      {listQuery.isSuccess && items.length === 0 && (
        <div className="rounded-md border bg-background p-8 text-center text-sm text-muted-foreground">
          暂无文档。点击右上角“新建文档”创建第一份表格文档。
        </div>
      )}

      {listQuery.isSuccess && items.length > 0 && (
        <div className="rounded-md border bg-background">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>标题</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>版本</TableHead>
                <TableHead>更新时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((d) => (
                <TableRow key={d.id} className="hover:bg-muted/40">
                  <TableCell className="font-medium text-default-800">
                    <Link className="hover:underline" href={docHref(d.id)}>
                      {d.title}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <DocumentStatusBadge status={d.status} />
                  </TableCell>
                  <TableCell>v{d.current_version_no}</TableCell>
                  <TableCell>{new Date(d.updated_at).toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    <Button asChild size="sm" variant="outline">
                      <Link href={docHref(d.id)}>打开</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </DocumentModuleShell>
  );
}

