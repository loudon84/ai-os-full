"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { getComponent } from "../../services/registry";
import { createEvent, dispatchEvent } from "../../services/event-protocol";
import { useGenerativeUiStore } from "../../stores/generative-ui-store";
import { SandboxFrame } from "./SandboxFrame";

export type ComponentPreviewProps = {
  componentName: string;
  props: Record<string, unknown>;
  showCode?: boolean;
};

export function ComponentPreview({
  componentName,
  props,
  showCode: showCodeInitial = false,
}: ComponentPreviewProps) {
  const [showCode, setShowCode] = React.useState(showCodeInitial);
  const renderSandbox = useGenerativeUiStore((s) => s.renderSandbox);

  const entry = getComponent(componentName);
  const source = entry?.sandboxSource ?? "";

  const propsKey = React.useMemo(() => JSON.stringify(props), [props]);

  const handleRender = React.useCallback(() => {
    renderSandbox("rendering");
    const evt = createEvent(
      "sandbox.render",
      { componentName, props },
      { task_id: "generative-ui-local" },
    );
    if (typeof window !== "undefined") {
      dispatchEvent(evt, window);
    }
    queueMicrotask(() => renderSandbox("idle"));
  }, [componentName, props, renderSandbox]);

  React.useEffect(() => {
    if (!source) return;
    handleRender();
  }, [componentName, source, propsKey, handleRender]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Switch
            id="toggle-code"
            checked={showCode}
            onCheckedChange={setShowCode}
          />
          <Label htmlFor="toggle-code" className="cursor-pointer">
            {showCode ? "隐藏源码" : "显示源码"}
          </Label>
        </div>
        <Button type="button" color="primary" onClick={handleRender}>
          重新渲染
        </Button>
      </div>

      {showCode && (
        <pre className="max-h-48 overflow-auto rounded-md border bg-muted/40 p-3 text-xs leading-relaxed">
          {source || "（未提供 sandbox 源码，请在 registry 中附带 sandboxSource）"}
        </pre>
      )}

      {source ? (
        <SandboxFrame
          title={`sandbox-${componentName}`}
          sandboxProps={props}
        >
          {source}
        </SandboxFrame>
      ) : (
        <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
          该组件未配置 iframe 源码；请在注册时传入 sandboxSource。
        </div>
      )}
    </div>
  );
}
