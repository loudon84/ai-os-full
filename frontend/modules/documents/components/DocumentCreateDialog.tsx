"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export function DocumentCreateDialog(props: { onCreate: (title: string) => void; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");

  const canSubmit = useMemo(() => title.trim().length > 0 && !props.disabled, [title, props.disabled]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" disabled={props.disabled}>
          新建文档
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>新建文档</DialogTitle>
        </DialogHeader>

        <div className="space-y-2">
          <div className="text-sm text-muted-foreground">目前仅支持表格文档（Univer 引擎）。</div>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="请输入文档标题" />
        </div>

        <DialogFooter>
          <Button
            onClick={() => {
              props.onCreate(title.trim());
              setTitle("");
              setOpen(false);
            }}
            disabled={!canSubmit}
          >
            创建
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

