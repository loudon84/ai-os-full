"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type KeyboardEvent,
} from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Loader2,
  Paperclip,
  Send,
  Square,
  Upload,
  X,
  Cpu,
  ChevronDown,
} from "lucide-react";
import { useRuntimeModels, type RuntimeModel } from "../hooks/use-runtime-models";
import { useRuntimeSessionStore } from "../stores/runtime-session-store";

const ACCEPTED_TYPES =
  "image/*,text/*,application/pdf,application/json," +
  "application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet," +
  "application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document," +
  ".md,.py,.js,.ts,.yaml,.yml,.toml,.csv,.sh,.txt,.log,.env,.xls,.xlsx,.doc,.docx";

export type ComposerSendPayload = {
  text: string;
  files: File[];
};

export function RuntimeComposer({
  isLoading,
  onSend,
  onCancel,
  onModelChange,
}: {
  isLoading: boolean;
  onSend: (payload: ComposerSendPayload) => void;
  onCancel: () => void;
  onModelChange?: (model: string) => void;
}) {
  const [value, setValue] = useState("");
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [showModelDropdown, setShowModelDropdown] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const composerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const dragCounter = useRef(0);

  const currentSession = useRuntimeSessionStore((s) => s.currentSession);
  const lastUsage = useRuntimeSessionStore((s) => s.lastUsage);
  const { data: modelsRaw } = useRuntimeModels();

  const models: RuntimeModel[] = (() => {
    if (!modelsRaw) return [];
    if (Array.isArray(modelsRaw)) return modelsRaw as RuntimeModel[];
    const obj = modelsRaw as Record<string, unknown>;
    if (Array.isArray(obj.models)) return obj.models as RuntimeModel[];
    return [];
  })();

  const currentModel = currentSession?.model ?? "";

  const hasContent = value.trim().length > 0 || pendingFiles.length > 0;
  const canSend = hasContent && !isLoading;

  // --- auto-resize textarea ---
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 200)}px`;
  }, [value]);

  // --- close model dropdown on outside click ---
  useEffect(() => {
    if (!showModelDropdown) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowModelDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showModelDropdown]);

  // --- send ---
  const send = useCallback(() => {
    const trimmed = value.trim();
    if ((!trimmed && pendingFiles.length === 0) || isLoading) return;
    onSend({ text: trimmed, files: [...pendingFiles] });
    setValue("");
    setPendingFiles([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [value, pendingFiles, isLoading, onSend]);

  // --- file handling ---
  const addFiles = useCallback((files: FileList | File[]) => {
    const arr = Array.from(files);
    setPendingFiles((prev) => {
      const existing = new Set(prev.map((f) => f.name));
      return [...prev, ...arr.filter((f) => !existing.has(f.name))];
    });
  }, []);

  const removeFile = useCallback((index: number) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleFileChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) addFiles(e.target.files);
      e.target.value = "";
    },
    [addFiles]
  );

  // --- drag & drop ---
  const handleDragEnter = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (dragCounter.current === 1) setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounter.current = 0;
      setIsDragging(false);
      if (e.dataTransfer.files?.length) {
        addFiles(e.dataTransfer.files);
      }
    },
    [addFiles]
  );

  // --- keyboard ---
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
        e.preventDefault();
        send();
      }
    },
    [send]
  );

  // --- context usage ---
  const usage = lastUsage as
    | { input_tokens?: number; context_length?: number; threshold_tokens?: number }
    | undefined;
  const ctxUsed = usage?.input_tokens ?? 0;
  const ctxTotal = usage?.context_length ?? 0;
  const ctxPercent = ctxTotal > 0 ? Math.round((ctxUsed / ctxTotal) * 100) : 0;
  const ctxColor =
    ctxPercent > 80 ? "text-red-500" : ctxPercent > 50 ? "text-yellow-500" : "text-emerald-500";

  // --- model groups ---
  const modelGroups = models.reduce<Record<string, RuntimeModel[]>>((acc, m) => {
    const group = m.group || m.provider || "Other";
    if (!acc[group]) acc[group] = [];
    acc[group].push(m);
    return acc;
  }, {});

  return (
    <div
      ref={composerRef}
      className="relative flex flex-col gap-0"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* drop overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-20 flex items-center justify-center rounded-xl border-2 border-dashed border-primary/50 bg-primary/5 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-2 text-primary">
            <Upload className="h-7 w-7" />
            <span className="text-sm font-medium">拖放文件到此处上传</span>
          </div>
        </div>
      )}

      {/* attachment tray */}
      {pendingFiles.length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-1 pb-2">
          {pendingFiles.map((f, i) => (
            <Badge
              key={`${f.name}-${i}`}
              variant="soft"
              color="secondary"
              className="flex items-center gap-1 pl-2 pr-1 py-0.5 text-xs"
            >
              <Paperclip className="h-3 w-3 shrink-0" />
              <span className="max-w-[120px] truncate">{f.name}</span>
              <button
                type="button"
                className="ml-0.5 rounded-full p-0.5 hover:bg-muted-foreground/20"
                onClick={() => removeFile(i)}
                aria-label={`移除 ${f.name}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* textarea */}
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Message Hermes…（Enter 发送，Shift+Enter 换行）"
        className="min-h-[44px] max-h-[200px] resize-none border-0 bg-transparent px-1 shadow-none focus-visible:ring-0"
        disabled={isLoading}
        onKeyDown={handleKeyDown}
        rows={1}
      />

      {/* footer bar */}
      <div className="flex items-center justify-between gap-2 px-1 pt-1">
        {/* left: tools */}
        <div className="flex items-center gap-1">
          {/* attach button */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={ACCEPTED_TYPES}
            className="hidden"
            onChange={handleFileChange}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => fileInputRef.current?.click()}
            title="添加附件"
            disabled={isLoading}
          >
            <Paperclip className="h-4 w-4" />
          </Button>

          <div className="mx-1 h-4 w-px bg-border" aria-hidden="true" />

          {/* model chip */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              className={cn(
                "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs",
                "border bg-muted/50 text-muted-foreground hover:bg-muted transition-colors",
                "disabled:opacity-50"
              )}
              onClick={() => setShowModelDropdown((v) => !v)}
              disabled={isLoading}
              title="选择模型"
            >
              <Cpu className="h-3 w-3" />
              <span className="max-w-[140px] truncate">
                {currentModel || "选择模型"}
              </span>
              <ChevronDown className="h-3 w-3" />
            </button>

            {showModelDropdown && (
              <div className="absolute bottom-full left-0 z-30 mb-1 max-h-[280px] min-w-[220px] overflow-y-auto rounded-lg border bg-popover p-1 shadow-lg">
                {Object.entries(modelGroups).length > 0 ? (
                  Object.entries(modelGroups).map(([group, items]) => (
                    <div key={group}>
                      <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {group}
                      </div>
                      {items.map((m) => {
                        const mid = m.id || m.model || "";
                        const label = m.display_name || mid;
                        return (
                          <button
                            key={mid}
                            type="button"
                            className={cn(
                              "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-accent",
                              mid === currentModel && "bg-accent font-medium"
                            )}
                            onClick={() => {
                              onModelChange?.(mid);
                              setShowModelDropdown(false);
                            }}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  ))
                ) : (
                  <div className="px-2 py-3 text-center text-xs text-muted-foreground">
                    暂无可用模型
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* right: status + actions */}
        <div className="flex items-center gap-1.5">
          {/* context indicator */}
          {ctxTotal > 0 && (
            <div className="group relative" title={`Context: ${ctxUsed} / ${ctxTotal} tokens`}>
              <div className="relative flex h-6 w-6 items-center justify-center">
                <svg className="h-6 w-6 -rotate-90" viewBox="0 0 24 24">
                  <circle
                    cx="12"
                    cy="12"
                    r="9.75"
                    fill="none"
                    strokeWidth="1.5"
                    className="stroke-muted"
                  />
                  <circle
                    cx="12"
                    cy="12"
                    r="9.75"
                    fill="none"
                    strokeWidth="2"
                    strokeDasharray={`${(ctxPercent / 100) * 61.26} 61.26`}
                    strokeLinecap="round"
                    className={cn("transition-all", ctxColor.replace("text-", "stroke-"))}
                  />
                </svg>
                <span className="absolute text-[8px] font-bold leading-none text-muted-foreground">
                  {ctxPercent}
                </span>
              </div>
              {/* tooltip */}
              <div className="absolute bottom-full right-0 z-30 mb-2 hidden w-48 rounded-lg border bg-popover p-2 text-xs shadow-lg group-hover:block">
                <div className="font-medium">Context window</div>
                <div className="mt-1 text-muted-foreground">
                  已用: {ctxUsed.toLocaleString()} / {ctxTotal.toLocaleString()} tokens
                </div>
                <div className="text-muted-foreground">使用率: {ctxPercent}%</div>
              </div>
            </div>
          )}

          {/* cancel button */}
          {isLoading && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={onCancel}
              title="停止生成"
              aria-label="停止生成"
            >
              <Square className="h-3.5 w-3.5" />
            </Button>
          )}

          {/* send button */}
          {!isLoading && (
            <Button
              type="button"
              size="icon"
              className="h-7 w-7"
              onClick={send}
              disabled={!canSend}
              title="发送消息"
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
          )}

          {/* loading indicator (replaces send) */}
          {isLoading && (
            <div className="flex h-7 w-7 items-center justify-center">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
      </div>

      {/* upload progress bar */}
      {uploadProgress !== null && (
        <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
      )}
    </div>
  );
}
