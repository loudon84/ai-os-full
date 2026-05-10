"use client";

import * as React from "react";
import { Plus, Search } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { useRegistry } from "../../hooks/use-registry";
import { useGenerativeUiStore } from "../../stores/generative-ui-store";
import { cn } from "@/lib/utils";

const QUICK_TEMPLATE_CODE = `
function Generated(props) {
  return React.createElement(
    "div",
    {
      style: {
        padding: "16px",
        borderRadius: "8px",
        border: "1px dashed #94a3b8",
        fontSize: "14px",
      },
    },
    props.caption,
  );
}
`.trim();

export function RegistryPanel({ className }: { className?: string }) {
  const { components, register } = useRegistry();
  const selected = useGenerativeUiStore((s) => s.selectedComponent);
  const setSelected = useGenerativeUiStore((s) => s.setSelectedComponent);

  const [query, setQuery] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [newName, setNewName] = React.useState("");
  const [newCode, setNewCode] = React.useState(QUICK_TEMPLATE_CODE);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return components;
    return components.filter((c) => c.name.toLowerCase().includes(q));
  }, [components, query]);

  const handleCreate = () => {
    const name = newName.trim();
    if (!name) return;
    const schema = z
      .object({
        caption: z.string().min(1, "说明不能为空").default("新建说明"),
      })
      .describe(name);
    register(schema, newCode.trim());
    setSelected(name);
    setOpen(false);
    setNewName("");
    setNewCode(QUICK_TEMPLATE_CODE);
  };

  return (
    <div className={cn("flex h-full min-h-0 flex-col gap-3", className)}>
      <div className="relative">
        <Search className="pointer-events-none absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-8"
          placeholder="搜索组件…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button color="primary" className="w-full">
            <Plus className="mr-2 h-4 w-4" />
            新建组件
          </Button>
        </DialogTrigger>
        <DialogContent size="2xl">
          <DialogHeader>
            <DialogTitle>注册 sandbox 组件</DialogTitle>
            <DialogDescription>
              将使用固定字段「caption」作为 props。源码须定义{" "}
              <code className="rounded bg-muted px-1">Generated</code>{" "}
              函数（React.createElement 风格）。
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="gc-name">组件名称（用作 registry 键）</Label>
              <Input
                id="gc-name"
                placeholder="例如：BannerCard"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="gc-code">sandbox 源码</Label>
              <Textarea
                id="gc-code"
                className="min-h-[200px] font-mono text-xs"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              取消
            </Button>
            <Button type="button" color="primary" onClick={handleCreate}>
              注册
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ScrollArea className="min-h-0 flex-1 rounded-md border">
        <ul className="divide-y p-2">
          {filtered.map((c) => {
            const active = selected === c.name;
            return (
              <li key={c.name}>
                <button
                  type="button"
                  onClick={() => setSelected(c.name)}
                  className={cn(
                    "flex w-full flex-col gap-1 rounded-md px-3 py-2 text-left text-sm transition-colors",
                    active ? "bg-primary/10 text-primary" : "hover:bg-muted/80",
                  )}
                >
                  <span className="font-semibold">{c.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {c.sandboxSource ? "含 iframe 源码" : "无 iframe 源码"}
                  </span>
                </button>
              </li>
            );
          })}
          {filtered.length === 0 && (
            <li className="px-3 py-6 text-center text-sm text-muted-foreground">
              无匹配组件
            </li>
          )}
        </ul>
      </ScrollArea>
    </div>
  );
}
