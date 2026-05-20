"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";
import type { EmailMessageResponse } from "@portal/shared";
import { Bot, FolderOpen, PanelRightClose, Sparkles, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import {
  useHermesPanelChat,
  type HermesPanelChatContext,
  type WorkspaceContentInjector,
  type WorkspaceInjectResult,
} from "../../hooks/use-hermes-panel-chat";
import { HermesPanelComposer } from "./HermesPanelComposer";
import { HermesPanelMessageList } from "./HermesPanelMessageList";
import { HermesPanelToolCard } from "./HermesPanelToolCard";
import { RuntimeWorkspacePanel } from "../../runtime/components/RuntimeWorkspacePanel";
import { cn } from "@/lib/utils";

export type HermesChatPresetAction = {
  label: string;
  prompt: string;
};

export type { WorkspaceContentInjector, WorkspaceInjectResult };

export function HermesChatPanel(props: {
  context?: HermesPanelChatContext | null;
  presetActions?: HermesChatPresetAction[];
  presetSystemPrompt?: string;
  profile?: string;
  /** 与 `scopeKeyEmailMessage` 等一致，用于绑定并恢复 Hermes runtime 会话 */
  sessionPersistenceKey?: string;
  /** 首轮写入 workspace 的完整邮件（需与 email 类 context 的 payload.id 一致） */
  emailForWorkspaceInject?: EmailMessageResponse | null;
  /** 首轮写入 workspace 的通用注入（与邮件二选一；邮件面板请勿传入） */
  workspaceInjector?: WorkspaceContentInjector;
  onWorkspaceInjected?: (result: WorkspaceInjectResult) => void;
  onApplyResult?: (markdown: string) => void;
  className?: string;
}) {
  const {
    context,
    presetActions,
    presetSystemPrompt,
    profile,
    sessionPersistenceKey,
    emailForWorkspaceInject,
    workspaceInjector,
    onWorkspaceInjected,
    onApplyResult,
    className,
  } = props;

  const [workspaceInvalidateKey, setWorkspaceInvalidateKey] = useState(0);

  const chat = useHermesPanelChat({
    context: context ?? null,
    presetSystemPrompt,
    profile,
    persistenceKey: sessionPersistenceKey,
    emailForWorkspaceInject: emailForWorkspaceInject ?? null,
    onEmailWorkspaceInjected: (r) => {
      if (!r.ok) return;
      if (r.skipped) {
        toast.success("Workspace 已有邮件上下文（未覆盖）");
      } else {
        toast.success("已将邮件正文与附件注入 Hermes Workspace");
      }
      setWorkspaceInvalidateKey((k) => k + 1);
    },
    workspaceInjector,
    onWorkspaceInjected: (r) => {
      onWorkspaceInjected?.(r);
      if (!r.ok) return;
      if (r.skipped) {
        toast.success("Workspace 已有业务上下文（未覆盖）");
      } else {
        toast.success("已将业务上下文写入 Hermes Workspace");
      }
      setWorkspaceInvalidateKey((k) => k + 1);
    },
  });

  const lastAssistant = [...chat.messages].reverse().find((m) => m.role === "assistant");
  const canApply =
    !!onApplyResult && !!lastAssistant?.content && !lastAssistant.isStreaming && !chat.busy;

  const [workspaceOpen, setWorkspaceOpen] = useState(true);

  return (
    <Card
      className={cn(
        "flex h-full min-h-0 flex-row border-l border-default-200 shadow-none",
        className,
      )}
    >
      <div
        className={cn(
          "flex min-h-0 min-w-0 flex-col",
          workspaceOpen ? "flex-[3] border-r border-default-100" : "flex-1",
        )}
      >
        <CardHeader className="flex-shrink-0 space-y-1 border-b border-default-100 py-3">
          <CardTitle className="flex min-w-0 items-start gap-2 text-sm font-semibold leading-snug">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span
              className="min-w-0 flex-1 break-words text-left line-clamp-2"
              title={context?.summary ?? "未附加业务上下文"}
            >
              {context?.summary ?? "未附加业务上下文"}
            </span>
          </CardTitle>
          <div className="flex flex-wrap items-center gap-1 pt-1">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-7 gap-1 px-2 text-xs"
              onClick={chat.clear}
              title="清空会话"
            >
              <Trash2 className="h-3.5 w-3.5" />
              清空
            </Button>
            {canApply ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                onClick={() => onApplyResult?.(lastAssistant!.content)}
              >
                采纳最后一条
              </Button>
            ) : null}
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-7 gap-1 px-2 text-xs"
              onClick={() => setWorkspaceOpen((v) => !v)}
              title={workspaceOpen ? "隐藏 Workspace 文件区" : "显示 Workspace 文件区"}
            >
              {workspaceOpen ? (
                <PanelRightClose className="h-3.5 w-3.5" />
              ) : (
                <FolderOpen className="h-3.5 w-3.5" />
              )}
              {workspaceOpen ? "隐藏文件区" : "显示文件区"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex min-h-0 flex-1 flex-col gap-2 p-3">
          {presetActions?.length ? (
            <div className="flex flex-shrink-0 flex-wrap gap-1.5">
              {presetActions.map((a) => (
                <Button
                  key={a.label}
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  disabled={chat.busy || chat.restoring || !context}
                  onClick={() => chat.send(a.prompt)}
                >
                  {a.label}
                </Button>
              ))}
            </div>
          ) : null}

          {presetActions?.length ? <Separator /> : null}

          <div className="chat-container flex min-h-0 flex-1 flex-col gap-2 overflow-hidden">
            {chat.error ? (
              <div className="flex-shrink-0 rounded-md border border-destructive/30 bg-destructive/10 px-2 py-1.5 text-xs text-destructive">
                {chat.error}
              </div>
            ) : null}

            {chat.toolCalls.length > 0 ? (
              <div className="flex max-h-32 flex-shrink-0 flex-col gap-1.5 overflow-y-auto">
                <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                  <Bot className="h-3.5 w-3.5" />
                  工具
                </div>
                {chat.toolCalls.map((tc) => (
                  <HermesPanelToolCard key={tc.tid} toolCall={tc} />
                ))}
              </div>
            ) : null}

            {chat.restoring ? (
              <p className="flex-shrink-0 py-2 text-center text-xs text-muted-foreground">加载历史会话…</p>
            ) : null}

            <HermesPanelMessageList messages={chat.messages} className="min-h-[80px] flex-1" />

            <HermesPanelComposer
              busy={chat.busy}
              onSend={chat.send}
              onCancel={chat.cancel}
              disabled={chat.restoring}
            />
          </div>
        </CardContent>
      </div>

      {workspaceOpen ? (
        <div className="workspace-container flex min-h-0 min-w-0 flex-[2] flex-col bg-muted/5 p-2 pl-1">
          <div className="flex min-h-0 min-w-[10rem] flex-1 flex-col overflow-hidden rounded-lg bg-background">
            <RuntimeWorkspacePanel
              boundSessionId={chat.sessionId}
              workspacePathLabel={chat.workspacePath}
              workspaceInvalidateKey={workspaceInvalidateKey}
              className="h-full min-h-0 rounded-lg border-0 shadow-none"
            />
          </div>
        </div>
      ) : null}
    </Card>
  );
}