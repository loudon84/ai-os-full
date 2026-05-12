"use client";

import type { ReactNode } from "react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * 全屏撰写壳层：固定视口 overlay + 顶栏 + 主编辑区 + 可选右侧 AI 栏。
 * 业务状态（表单、Tiptap、发送）由父组件通过 `main` / `rightPanel` 注入。
 */
export function EmailComposeWorkspace(props: {
  /** 顶栏区域（标题、最小化、关闭等） */
  header: ReactNode;
  /** 主内容区（表单 + 编辑器） */
  main: ReactNode;
  /** 右侧 AI 面板（宽屏显示） */
  rightPanel?: ReactNode;
  /** 主内容区是否因最小化而隐藏 */
  minimize?: boolean;
}) {
  const { header, main, rightPanel, minimize = false } = props;

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-background">
      <Card className="flex h-full min-h-0 flex-col rounded-none border-0 shadow-none">
        <CardHeader className="mb-0 block border-none p-0">{header}</CardHeader>
        <CardContent
          className={cn("flex min-h-0 flex-1 gap-4 px-6 pb-6", minimize && "hidden")}
        >
          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto">{main}</div>
          {rightPanel ? (
            <div className="hidden w-[min(100%,380px)] shrink-0 md:block">{rightPanel}</div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
