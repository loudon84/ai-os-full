"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Loader2, Send, Square } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export function HermesPanelComposer(props: {
  busy: boolean;
  onSend: (text: string) => void;
  onCancel: () => void;
  /** 例如恢复历史会话时禁用输入 */
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}) {
  const {
    busy,
    onSend,
    onCancel,
    disabled = false,
    placeholder = "输入消息…（Enter 发送，Shift+Enter 换行）",
    className,
  } = props;
  const [value, setValue] = useState("");
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`;
  }, [value]);

  const submit = useCallback(() => {
    const t = value.trim();
    if (!t || busy || disabled) return;
    onSend(t);
    setValue("");
    if (taRef.current) taRef.current.style.height = "auto";
  }, [busy, disabled, onSend, value]);

  const onKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
        e.preventDefault();
        submit();
      }
    },
    [submit],
  );

  return (
    <div className={cn("flex flex-col gap-2 border-t border-border pt-2", className)}>
      <Textarea
        ref={taRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        disabled={busy || disabled}
        rows={2}
        className="min-h-[52px] max-h-[160px] resize-none text-sm"
      />
      <div className="flex justify-end gap-1.5">
        {busy ? (
          <Button type="button" size="sm" variant="outline" className="gap-1" onClick={onCancel}>
            <Square className="h-3.5 w-3.5" />
            停止
          </Button>
        ) : null}
        <Button
          type="button"
          size="sm"
          className="gap-1"
          onClick={submit}
          disabled={busy || disabled || !value.trim()}
        >
          {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
          发送
        </Button>
      </div>
    </div>
  );
}
