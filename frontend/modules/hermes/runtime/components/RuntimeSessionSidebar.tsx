"use client";

import { useEffect, useMemo, useState } from "react";
import type { RuntimeSession } from "../types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Plus, Trash2 } from "lucide-react";

type Props = {
  sessions: RuntimeSession[];
  activeSessionId: string | null;
  onSelect: (sessionId: string) => void;
  onCreate: () => void;
  onDelete: (sessionId: string) => void;
  isLoading?: boolean;
};

export function RuntimeSessionSidebar({
  sessions,
  activeSessionId,
  onSelect,
  onCreate,
  onDelete,
  isLoading,
}: Props) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const list = Array.isArray(sessions) ? sessions : [];
    const needle = q.trim().toLowerCase();
    if (!needle) return list;
    return list.filter((s) => {
      const title = String(s.title ?? "").toLowerCase();
      const id = String(s.session_id ?? "").toLowerCase();
      return title.includes(needle) || id.includes(needle);
    });
  }, [q, sessions]);

  useEffect(() => {
    // keep sidebar responsive when sessions refresh
  }, [sessions]);

  return (
    <div className="flex h-full flex-col border-r bg-background">
      <div className="flex items-center gap-2 p-3">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="搜索会话…"
        />
        <Button
          size="icon"
          variant="secondary"
          onClick={onCreate}
          disabled={!!isLoading}
          aria-label="新建会话"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {filtered.length === 0 ? (
            <div className="px-2 py-6 text-sm text-muted-foreground">
              暂无会话
            </div>
          ) : (
            filtered.map((s) => {
              const active = s.session_id === activeSessionId;
              return (
                <div
                  key={s.session_id}
                  className={cn(
                    "group flex items-center gap-2 rounded-md border px-2 py-2 hover:bg-muted/50",
                    active && "border-primary/50 bg-muted"
                  )}
                >
                  <button
                    className="flex-1 text-left"
                    onClick={() => onSelect(s.session_id)}
                    type="button"
                  >
                    <div className="truncate text-sm font-medium">
                      {s.title || "Untitled"}
                    </div>
                    <div className="truncate text-xs text-muted-foreground">
                      {s.model ? `model: ${s.model}` : s.session_id}
                    </div>
                  </button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="opacity-0 group-hover:opacity-100"
                    onClick={() => onDelete(s.session_id)}
                    aria-label="删除会话"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

