"use client";

import React from "react";
import { Folder, FileText } from "lucide-react";
import { Tree } from "@/components/ui/tree";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { mockWorkspaceFiles, type WorkspaceFileNode } from "@/modules/workspace/mocks/workspace-files";

type TreeNodeData = {
  id: string;
  label: string;
  children?: TreeNodeData[];
  icon?: React.ReactNode;
};

function toTreeNodes(nodes: WorkspaceFileNode[]): TreeNodeData[] {
  return nodes.map((n) => ({
    id: n.id,
    label: n.label,
    icon: n.children?.length ? <Folder className="h-4 w-4 text-muted-foreground" /> : <FileText className="h-4 w-4 text-muted-foreground" />,
    children: n.children ? toTreeNodes(n.children) : undefined,
  }));
}

export function WorkspaceFilesPanel({ className }: { className?: string }) {
  const [query, setQuery] = React.useState("");

  const data = React.useMemo(() => {
    // 先提供最小可用的“文件树”骨架：后续接入真实 workspace 数据源时替换这里即可
    const tree = toTreeNodes(mockWorkspaceFiles);
    if (!query.trim()) return tree;
    const q = query.trim().toLowerCase();

    const filter = (nodes: TreeNodeData[]): TreeNodeData[] =>
      nodes
        .map((n) => {
          const children = n.children ? filter(n.children) : undefined;
          const selfMatch = n.label.toLowerCase().includes(q);
          const childMatch = children && children.length > 0;
          if (!selfMatch && !childMatch) return null;
          return { ...n, children };
        })
        .filter(Boolean) as TreeNodeData[];

    return filter(tree);
  }, [query]);

  return (
    <aside className={cn("flex h-full w-[280px] flex-col border-r border-border bg-card", className)}>
      <div className="px-3 pt-4 pb-3">
        <div className="text-sm font-semibold text-foreground">Workspace files</div>
        <div className="mt-2">
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="搜索文件…" className="h-9" />
        </div>
      </div>
      <ScrollArea className="flex-1 px-2 pb-4">
        {data.length > 0 ? (
          <Tree data={data} defaultExpandedKeys={["root", "docs", "data", "src"]} showLine className="w-full" />
        ) : (
          <div className="px-2 py-6 text-sm text-muted-foreground">没有匹配的文件</div>
        )}
      </ScrollArea>
    </aside>
  );
}

