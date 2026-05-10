"use client";

import * as React from "react";
import { z } from "zod";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { getComponent } from "../services/registry";
import { useGenerativeUiStore } from "../stores/generative-ui-store";
import { ComponentPreview } from "./sandbox/ComponentPreview";
import { RegistryPanel } from "./registry/RegistryPanel";
import { SchemaForm, getSchemaDefaults } from "./registry/SchemaForm";
import { EventLogPanel } from "./event-log/EventLogPanel";

export function GenerativeUIWorkspace() {
  const selected = useGenerativeUiStore((s) => s.selectedComponent);
  const [previewProps, setPreviewProps] = React.useState<Record<string, unknown>>(
    {},
  );

  React.useEffect(() => {
    if (!selected) return;
    const entry = getComponent(selected);
    if (!entry) return;
    const { schema } = entry;
    if (schema instanceof z.ZodObject) {
      setPreviewProps(getSchemaDefaults(schema));
    }
  }, [selected]);

  const entry = selected ? getComponent(selected) : undefined;
  const rawSchema = entry?.schema;
  const objectSchema =
    rawSchema instanceof z.ZodObject
      ? (rawSchema as z.ZodObject<Record<string, z.ZodTypeAny>>)
      : null;

  return (
    <div className="h-[min(720px,calc(100vh-8rem))] min-h-[520px] w-full">
      <ResizablePanelGroup
        direction="horizontal"
        className="h-full rounded-lg border bg-background"
      >
        <ResizablePanel defaultSize={24} minSize={16} className="min-w-0">
          <div className="flex h-full min-h-0 flex-col gap-2 p-3">
            <h2 className="text-sm font-semibold">组件注册表</h2>
            <RegistryPanel className="min-h-0 flex-1" />
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={48} minSize={32} className="min-w-0">
          <div className="flex h-full min-h-0 flex-col gap-3 overflow-auto p-3">
            <h2 className="text-sm font-semibold">Sandbox 预览</h2>
            {selected && objectSchema ? (
              <>
                <ComponentPreview componentName={selected} props={previewProps} />
                <div className="rounded-md border bg-card p-3">
                  <h3 className="mb-3 text-xs font-medium text-muted-foreground">
                    属性表单（Zod）
                  </h3>
                  <SchemaForm
                    key={selected}
                    schema={objectSchema}
                    onSubmit={(values) =>
                      setPreviewProps(values as Record<string, unknown>)
                    }
                    submitLabel="应用到预览"
                  />
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                请从左侧选择一个组件。
              </p>
            )}
          </div>
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={28} minSize={18} className="min-w-0">
          <div className="flex h-full min-h-0 flex-col gap-2 p-3">
            <h2 className="text-sm font-semibold">事件时间线</h2>
            <EventLogPanel className="min-h-0 flex-1" />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
