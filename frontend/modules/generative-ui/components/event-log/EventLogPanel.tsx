"use client";

import * as React from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGenerativeUiStore } from "../../stores/generative-ui-store";
import type { AGUIEvent } from "../../types";
import { cn } from "@/lib/utils";

function payloadPreview(payload: Record<string, unknown>, max = 120) {
  try {
    const s = JSON.stringify(payload);
    return s.length > max ? `${s.slice(0, max)}…` : s;
  } catch {
    return "(无法序列化)";
  }
}

export function EventLogPanel({ className }: { className?: string }) {
  const eventLog = useGenerativeUiStore((s) => s.eventLog);
  const clearLog = useGenerativeUiStore((s) => s.clearLog);

  const types = React.useMemo(() => {
    const set = new Set<string>();
    eventLog.forEach((e) => set.add(e.type));
    return ["全部", ...Array.from(set).sort()];
  }, [eventLog]);

  const [filterType, setFilterType] = React.useState("全部");
  const [q, setQ] = React.useState("");

  const filtered = React.useMemo(() => {
    return eventLog.filter((e) => {
      if (filterType !== "全部" && e.type !== filterType) return false;
      if (!q.trim()) return true;
      const needle = q.trim().toLowerCase();
      return (
        e.type.toLowerCase().includes(needle) ||
        payloadPreview(e.payload).toLowerCase().includes(needle)
      );
    });
  }, [eventLog, filterType, q]);

  return (
    <div className={cn("flex h-full min-h-0 flex-col gap-3", className)}>
      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-[140px] flex-1 space-y-1">
          <Label className="text-xs text-muted-foreground">事件类型</Label>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger>
              <SelectValue placeholder="筛选类型" />
            </SelectTrigger>
            <SelectContent>
              {types.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="min-w-[160px] flex-1 space-y-1">
          <Label className="text-xs text-muted-foreground">关键词</Label>
          <Input
            placeholder="搜索 payload…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <Button type="button" variant="outline" onClick={() => clearLog()}>
          <Trash2 className="mr-2 h-4 w-4" />
          清空
        </Button>
      </div>

      <ScrollArea className="min-h-0 flex-1 rounded-md border">
        <ul className="divide-y">
          {filtered.map((e: AGUIEvent, i: number) => (
            <li key={`${e.type}-${i}`} className="px-3 py-2 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded bg-muted px-2 py-0.5 font-mono text-xs">
                  {e.type}
                </span>
                <span className="text-xs text-muted-foreground">
                  {e.ts != null
                    ? new Date(e.ts).toLocaleTimeString()
                    : "—"}
                </span>
              </div>
              <pre className="mt-1 whitespace-pre-wrap break-all font-mono text-xs text-muted-foreground">
                {payloadPreview(e.payload, 400)}
              </pre>
            </li>
          ))}
          {filtered.length === 0 && (
            <li className="px-3 py-8 text-center text-sm text-muted-foreground">
              暂无事件
            </li>
          )}
        </ul>
      </ScrollArea>
    </div>
  );
}
