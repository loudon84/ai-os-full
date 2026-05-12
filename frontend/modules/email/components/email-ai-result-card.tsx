"use client";

import { Check, Copy, RefreshCw } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function EmailAiResultCard(props: {
  title: string;
  markdown: string;
  loading?: boolean;
  className?: string;
  onRetry?: () => void;
  onApplyToEditor?: (text: string) => void;
  onClose?: () => void;
}) {
  const { title, markdown, loading, className, onRetry, onApplyToEditor, onClose } = props;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(markdown);
      toast.success("已复制");
    } catch {
      toast.error("复制失败");
    }
  };

  return (
    <Card className={cn("border-primary/20", className)}>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0 py-3">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="flex flex-wrap gap-1">
          {onRetry && (
            <Button type="button" size="sm" variant="ghost" className="h-8 px-2" onClick={() => void onRetry()}>
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button type="button" size="sm" variant="ghost" className="h-8 px-2" onClick={() => void handleCopy()}>
            <Copy className="h-3.5 w-3.5" />
          </Button>
          {onApplyToEditor && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-8 gap-1 px-2"
              onClick={() => onApplyToEditor(markdown)}
            >
              <Check className="h-3.5 w-3.5" />
              采纳
            </Button>
          )}
          {onClose && (
            <Button type="button" size="sm" variant="ghost" className="h-8 px-2" onClick={onClose}>
              关闭
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="max-h-[320px] overflow-y-auto border-t border-border pt-3 text-sm">
        {loading ? (
          <p className="text-muted-foreground">生成中…</p>
        ) : (
          <div className="max-w-none text-sm leading-relaxed text-foreground [&_a]:text-primary [&_a]:underline [&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-muted [&_pre]:p-2 [&_table]:w-full [&_th]:border [&_td]:border [&_th]:p-1 [&_td]:p-1">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown || "_（无输出）_"}</ReactMarkdown>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
