"use client";

import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useMemo, useState } from "react";
import {
  ArrowUp,
  FilePlus,
  Folder,
  FolderPlus,
  MoreHorizontal,
  RefreshCcw,
  FileText,
} from "lucide-react";
import { useRuntimeSessionStore } from "../stores/runtime-session-store";
import { useRuntimeWorkspace } from "../hooks/use-runtime-workspace";
import { RuntimeFsPromptDialog } from "./RuntimeFsPromptDialog";
import { RuntimeFilePreviewDialog } from "./RuntimeFilePreviewDialog";

type PromptKind = "newFile" | "newFolder" | "rename";

export function RuntimeWorkspacePanel() {
  const session = useRuntimeSessionStore((s) => s.currentSession);
  const { sessionId, currentDir, setCurrentDir, goUp, entries, listQuery, refresh, createFile, createDir, rename, remove } =
    useRuntimeWorkspace();

  const [prompt, setPrompt] = useState<{ kind: PromptKind; targetPath?: string } | null>(null);
  const [previewPath, setPreviewPath] = useState<string | null>(null);

  const breadcrumbs = useMemo(() => {
    const dir = currentDir || ".";
    if (dir === "." || !dir) return [{ label: ".", path: "." }];
    const parts = dir.split("/").filter(Boolean);
    const crumbs: Array<{ label: string; path: string }> = [{ label: ".", path: "." }];
    let acc = "";
    for (const p of parts) {
      acc = acc ? `${acc}/${p}` : p;
      crumbs.push({ label: p, path: acc });
    }
    return crumbs;
  }, [currentDir]);

  const disabled = !sessionId;

  const submitPrompt = async (value: string) => {
    if (!prompt) return;
    if (prompt.kind === "newFile") {
      const base = currentDir && currentDir !== "." ? `${currentDir}/` : "";
      await createFile.mutateAsync({ path: `${base}${value}`, content: "" });
    } else if (prompt.kind === "newFolder") {
      const base = currentDir && currentDir !== "." ? `${currentDir}/` : "";
      await createDir.mutateAsync({ path: `${base}${value}` });
    } else if (prompt.kind === "rename") {
      const target = prompt.targetPath;
      if (!target) return;
      await rename.mutateAsync({ path: target, newName: value });
    }
  };

  const onDelete = async (path: string) => {
    if (disabled) return;
    if (!window.confirm(`确定删除文件？\n${path}`)) return;
    await remove.mutateAsync({ path });
  };

  return (
    <div className="flex h-full flex-col rounded-xl border bg-background overflow-hidden">
      <div className="flex items-center justify-between gap-2 border-b p-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold">Workspace</div>
          <div className="truncate text-xs text-muted-foreground" title={session?.workspace ?? ""}>
            {session?.workspace ?? "—"}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            size="icon"
            variant="ghost"
            aria-label="New file"
            disabled={disabled || createFile.isPending}
            onClick={() => setPrompt({ kind: "newFile" })}
          >
            <FilePlus className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            aria-label="New folder"
            disabled={disabled || createDir.isPending}
            onClick={() => setPrompt({ kind: "newFolder" })}
          >
            <FolderPlus className="h-4 w-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            aria-label="Refresh"
            disabled={disabled || listQuery.isFetching}
            onClick={() => void refresh()}
          >
            <RefreshCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2 border-b px-2 py-1">
        <Button
          size="icon"
          variant="ghost"
          aria-label="Parent directory"
          disabled={disabled || currentDir === "."}
          onClick={() => goUp()}
        >
          <ArrowUp className="h-4 w-4" />
        </Button>
        <Separator orientation="vertical" className="h-6" />
        <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto py-1">
          {breadcrumbs.map((c, idx) => (
            <div key={c.path} className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                disabled={disabled}
                onClick={() => setCurrentDir(c.path)}
              >
                {c.label}
              </Button>
              {idx < breadcrumbs.length - 1 ? (
                <span className="text-xs text-muted-foreground">/</span>
              ) : null}
            </div>
          ))}
        </div>
      </div>

      {listQuery.isError ? (
        <div className="border-b bg-destructive/5 p-3 text-xs">
          <div className="font-medium text-destructive">加载失败</div>
          <div className="mt-1 whitespace-pre-wrap text-muted-foreground">
            {listQuery.error instanceof Error ? listQuery.error.message : String(listQuery.error)}
          </div>
          <div className="mt-2">
            <Button size="sm" variant="outline" onClick={() => void refresh()} disabled={disabled}>
              重试
            </Button>
          </div>
        </div>
      ) : null}

      <ScrollArea className="flex-1">
        <div className="p-2">
          {!sessionId ? (
            <div className="rounded-lg border bg-muted/20 p-3 text-sm text-muted-foreground">
              请选择或创建会话以查看 workspace。
            </div>
          ) : listQuery.isLoading ? (
            <div className="p-2 text-sm text-muted-foreground">加载中…</div>
          ) : entries.length === 0 ? (
            <div className="p-2 text-sm text-muted-foreground">空目录</div>
          ) : (
            <div className="space-y-1">
              {entries.map((e) => (
                <div
                  key={e.path}
                  className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted/40"
                >
                  <div className="shrink-0 text-muted-foreground">
                    {e.type === "dir" ? (
                      <Folder className="h-4 w-4" />
                    ) : (
                      <FileText className="h-4 w-4" />
                    )}
                  </div>
                  <button
                    type="button"
                    className="min-w-0 flex-1 text-left"
                    onClick={() => {
                      if (e.type === "dir") setCurrentDir(e.path);
                      else setPreviewPath(e.path);
                    }}
                  >
                    <div className="truncate text-sm" title={e.path}>
                      {e.name}
                    </div>
                    {e.type === "file" && typeof e.size === "number" ? (
                      <div className="text-xs text-muted-foreground">{e.size} bytes</div>
                    ) : null}
                  </button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="icon" variant="ghost" aria-label="Actions" disabled={disabled}>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      {e.type === "file" ? (
                        <DropdownMenuItem onClick={() => setPreviewPath(e.path)}>
                          打开预览
                        </DropdownMenuItem>
                      ) : null}
                      <DropdownMenuItem
                        onClick={() => setPrompt({ kind: "rename", targetPath: e.path })}
                      >
                        重命名
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => void onDelete(e.path)}
                      >
                        删除
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      <RuntimeFsPromptDialog
        open={!!prompt}
        onOpenChange={(o) => {
          if (!o) setPrompt(null);
        }}
        title={
          prompt?.kind === "newFile"
            ? "新建文件"
            : prompt?.kind === "newFolder"
              ? "新建文件夹"
              : "重命名"
        }
        description={
          prompt?.kind === "rename" && prompt?.targetPath
            ? `目标：${prompt.targetPath}`
            : currentDir === "."
              ? "将创建在 workspace 根目录"
              : `将创建在：${currentDir}/`
        }
        placeholder={
          prompt?.kind === "rename"
            ? "请输入新名称（不含路径）"
            : prompt?.kind === "newFolder"
              ? "例如：docs"
              : "例如：README.md"
        }
        submitLabel={prompt?.kind === "rename" ? "重命名" : "创建"}
        onSubmit={async (v) => {
          await submitPrompt(v);
        }}
      />

      <RuntimeFilePreviewDialog
        open={!!previewPath}
        onOpenChange={(o) => {
          if (!o) setPreviewPath(null);
        }}
        path={previewPath}
      />
    </div>
  );
}

