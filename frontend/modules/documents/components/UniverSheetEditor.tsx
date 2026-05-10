"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import type { SpreadsheetEngineInstance } from "../adapters/SpreadsheetEngineAdapter";
import { UniverSpreadsheetAdapter } from "../adapters/univer/UniverSpreadsheetAdapter";

import type { SheetRangeContext } from "../types/documentAiSpreadsheet.types";

export function UniverSheetEditor(props: {
  readonly?: boolean;
  initialSnapshot?: Record<string, unknown>;
  onReady?: (instance: SpreadsheetEngineInstance) => void;
  onDirtyChange?: (dirty: boolean) => void;
  onSelectionContextChange?: (ctx: SheetRangeContext | null) => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const instanceRef = useRef<SpreadsheetEngineInstance | null>(null);
  const [ready, setReady] = useState(false);

  const adapter = useMemo(() => new UniverSpreadsheetAdapter(), []);

  useEffect(() => {
    if (!containerRef.current) return;

    const instance = adapter.mount({
      container: containerRef.current,
      readonly: props.readonly,
      initialSnapshot: props.initialSnapshot,
      onDirtyChange: props.onDirtyChange,
      onSelectionContextChange: props.onSelectionContextChange,
    });

    instanceRef.current = instance;
    props.onReady?.(instance);
    setReady(true);

    return () => {
      instance.dispose();
      instanceRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    instanceRef.current?.setReadonly(Boolean(props.readonly));
  }, [props.readonly]);

  return (
    <div className="h-full w-full overflow-hidden rounded-md border bg-background">
      {!ready && <div className="p-4 text-sm text-muted-foreground">加载表格中...</div>}
      <div ref={containerRef} className="h-full w-full" />
    </div>
  );
}

