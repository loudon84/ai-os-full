"use client";

import * as React from "react";
import { GenerativeUIWorkspace } from "../components/GenerativeUIWorkspace";
import { onSandboxEvent } from "../services/event-protocol";
import { getComponent } from "../services/registry";
import { USER_CARD_SANDBOX_SOURCE } from "../sandbox/user-card-sandbox-source";
import { userCardPropsSchema } from "../sandbox/user-card-schema";
import { UserCard } from "../sandbox/UserCard";
import { useGenerativeUiStore } from "../stores/generative-ui-store";

export default function GenerativeUIPage() {
  const register = useGenerativeUiStore((s) => s.register);
  const setSelected = useGenerativeUiStore((s) => s.setSelectedComponent);

  React.useEffect(() => {
    return onSandboxEvent((ev) => {
      useGenerativeUiStore.getState().appendEvent(ev);
    });
  }, []);

  React.useEffect(() => {
    if (getComponent("UserCard")) return;
    register("UserCard", userCardPropsSchema, UserCard, USER_CARD_SANDBOX_SOURCE);
    setSelected("UserCard");
  }, [register, setSelected]);

  return (
    <div className="space-y-4 p-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Generative UI</h1>
        <p className="text-sm text-muted-foreground">
          在 sandbox iframe 中预览生成组件；左侧管理注册表，右侧查看 AG-UI
          风格事件流（本地演示）。
        </p>
      </header>
      <GenerativeUIWorkspace />
    </div>
  );
}
