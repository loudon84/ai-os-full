"use client";

import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { RuntimeMarkdown } from "./RuntimeMarkdown";
import { useRuntimeWorkspace } from "../hooks/use-runtime-workspace";

function extOf(path: string): string {
  const parts = path.split("/");
  const name = parts[parts.length - 1] ?? "";
  const idx = name.lastIndexOf(".");
  return idx >= 0 ? name.slice(idx + 1).toLowerCase() : "";
}

const IMAGE_EXTS = new Set(["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp", "ico"]);
const MD_EXTS = new Set(["md", "markdown"]);

export function RuntimeFilePreviewDialog({
  open,
  onOpenChange,
  path,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  path: string | null;
}) {
  const { sessionId, buildRawUrl, readTextFile, saveFile } = useRuntimeWorkspace();
  const filePath = path ?? "";

  const ext = useMemo(() => extOf(filePath), [filePath]);
  const isImage = IMAGE_EXTS.has(ext);
  const isMarkdown = MD_EXTS.has(ext);
  const isText = !isImage;

  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [original, setOriginal] = useState<string>("");
  const [content, setContent] = useState<string>("");
  const [mode, setMode] = useState<"preview" | "edit">(isMarkdown ? "preview" : "edit");

  const dirty = isText && content !== original;

  useEffect(() => {
    if (!open) return;
    if (!filePath) return;
    setLoadError(null);
    if (isText) {
      setLoading(true);
      void (async () => {
        try {
          const data = await readTextFile(filePath);
          const c = data?.content ?? "";
          setOriginal(c);
          setContent(c);
          setMode(isMarkdown ? "preview" : "edit");
        } catch (e) {
          setLoadError(e instanceof Error ? e.message : String(e));
        } finally {
          setLoading(false);
        }
      })();
    } else {
      setOriginal("");
      setContent("");
      setMode("preview");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, filePath, isText, isMarkdown]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        if (!dirty) return;
        e.preventDefault();
        void onSave();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, dirty, content, filePath, sessionId]);

  const onSave = async () => {
    if (!filePath) return;
    if (!dirty) return;
    await saveFile.mutateAsync({ path: filePath, content });
    setOriginal(content);
  };

  const headerTitle = filePath ? filePath.split("/").pop() : "预览";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[900px] p-0">
        <DialogHeader className="border-b p-4">
          <DialogTitle className="truncate" title={filePath}>
            {headerTitle || "预览"}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[70vh]">
          <div className="p-4">
            {!sessionId ? (
              <div className="text-sm text-muted-foreground">请选择或创建会话后再预览文件。</div>
            ) : !filePath ? (
              <div className="text-sm text-muted-foreground">未选择文件。</div>
            ) : isImage ? (
              <div className="space-y-3">
                <div className="rounded-lg border bg-muted/20 p-2">
                  <img
                    src={buildRawUrl(filePath)}
                    alt={filePath}
                    className="mx-auto max-h-[60vh] max-w-full rounded-md"
                  />
                </div>
                <div className="text-xs text-muted-foreground">图片预览为只读。</div>
              </div>
            ) : loading ? (
              <div className="text-sm text-muted-foreground">加载中…</div>
            ) : loadError ? (
              <div className="space-y-2">
                <div className="text-sm text-destructive">加载失败</div>
                <div className="text-xs text-muted-foreground whitespace-pre-wrap">{loadError}</div>
              </div>
            ) : isMarkdown && mode === "preview" ? (
              <RuntimeMarkdown content={content} />
            ) : (
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[52vh] font-mono text-sm"
              />
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="border-t p-4">
          <div className="flex w-full items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              {isMarkdown && isText ? (
                <Button
                  variant="outline"
                  onClick={() => setMode((m) => (m === "preview" ? "edit" : "preview"))}
                  disabled={!filePath || !sessionId || loading || !!loadError}
                >
                  {mode === "preview" ? "编辑" : "预览"}
                </Button>
              ) : null}
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={() => onOpenChange(false)}>
                关闭
              </Button>
              {isText ? (
                <Button
                  onClick={() => void onSave()}
                  disabled={!dirty || saveFile.isPending || !filePath || !sessionId}
                >
                  保存
                </Button>
              ) : null}
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

