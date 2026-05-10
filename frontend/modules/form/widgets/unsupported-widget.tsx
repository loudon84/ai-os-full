"use client";

import type { WidgetProps } from "@rjsf/utils";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function UnsupportedWidget(props: WidgetProps) {
  const widgetName = (props as any)?.options?.widget ?? (props as any)?.uiSchema?.["ui:widget"];
  const field = props.label || props.id || "字段";

  return (
    <Alert variant="destructive">
      <AlertTitle>不支持的字段组件</AlertTitle>
      <AlertDescription>
        {field} 当前 widget 未实现（{String(widgetName ?? "unknown")}）。该字段将以占位形式显示。
      </AlertDescription>
    </Alert>
  );
}

