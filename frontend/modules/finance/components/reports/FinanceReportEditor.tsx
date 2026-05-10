"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { EditorMode, ReportVersion } from "../../types/finance.types";

type FinanceReportEditorProps = {
  content: string;
  mode: EditorMode;
  onModeChange: (mode: EditorMode) => void;
  onContentChange?: (content: string) => void;
  versions?: ReportVersion[];
};

const modeLabels: Record<EditorMode, string> = {
  readonly: "只读",
  edit: "编辑",
  version_review: "版本审阅",
  insert_ai: "AI 辅助",
};

export function FinanceReportEditor({
  content,
  mode,
  onModeChange,
  onContentChange,
  versions,
}: FinanceReportEditorProps) {
  const [editContent, setEditContent] = useState(content);
  const [selectedVersion, setSelectedVersion] = useState<string>("1");

  const handleContentChange = (value: string) => {
    setEditContent(value);
    onContentChange?.(value);
  };

  return (
    <div className="space-y-3">
      {/* Mode selector */}
      <div className="flex items-center gap-2">
        {(Object.keys(modeLabels) as EditorMode[]).map((m) => (
          <Button
            key={m}
            color={mode === m ? "primary" : "default"}
            variant={mode === m ? undefined : "outline"}
            size="sm"
            onClick={() => onModeChange(m)}
          >
            {modeLabels[m]}
          </Button>
        ))}
      </div>

      {/* Editor content based on mode */}
      {mode === "readonly" && (
        <div
          className="min-h-[300px] rounded-md border p-4 text-sm"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      )}

      {mode === "edit" && (
        <Textarea
          value={editContent}
          onChange={(e) => handleContentChange(e.target.value)}
          className="min-h-[300px] font-mono text-sm"
        />
      )}

      {mode === "version_review" && (
        <div className="space-y-3">
          {versions && versions.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">版本</span>
              <Select value={selectedVersion} onValueChange={setSelectedVersion}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {versions.map((v) => (
                    <SelectItem key={v.version} value={String(v.version)}>
                      v{v.version}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div
            className="min-h-[300px] rounded-md border p-4 text-sm"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </div>
      )}

      {mode === "insert_ai" && (
        <div className="space-y-3">
          <Textarea
            value={editContent}
            onChange={(e) => handleContentChange(e.target.value)}
            className="min-h-[300px] font-mono text-sm"
          />
          <Button variant="outline" size="sm">
            ✨ AI 插入
          </Button>
        </div>
      )}
    </div>
  );
}
