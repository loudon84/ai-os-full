"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { SANDBOX_ATTR, buildSandboxSrcDoc } from "../../services/sandbox";

export type SandboxFrameProps = {
  title: string;
  /** iframe 内执行的组件源码（配合 React UMD） */
  children: string;
  className?: string;
  /** 传入 sandbox 渲染的属性 */
  sandboxProps?: Record<string, unknown>;
};

type BoundaryState = { error: Error | null };

class SandboxFrameErrorBoundary extends React.Component<
  { children: React.ReactNode },
  BoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error: Error): BoundaryState {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          预览边界捕获错误：{this.state.error.message}
        </div>
      );
    }
    return this.props.children;
  }
}

export function SandboxFrame({
  title,
  children: sourceCode,
  className,
  sandboxProps = {},
}: SandboxFrameProps) {
  const iframeRef = React.useRef<HTMLIFrameElement>(null);
  const [loading, setLoading] = React.useState(true);
  const sandboxKey = React.useMemo(() => JSON.stringify(sandboxProps), [sandboxProps]);

  React.useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    setLoading(true);
    iframe.setAttribute("sandbox", SANDBOX_ATTR);
    iframe.srcdoc = buildSandboxSrcDoc(sourceCode, sandboxProps);
  }, [sourceCode, sandboxKey]);

  return (
    <SandboxFrameErrorBoundary>
      <div className={`relative w-full ${className ?? ""}`}>
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-background/70">
            <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
            <span className="sr-only">加载 sandbox</span>
          </div>
        )}
        <iframe
          ref={iframeRef}
          title={title}
          className="min-h-[220px] w-full rounded-lg border border-border bg-card"
          sandbox={SANDBOX_ATTR}
          onLoad={() => setLoading(false)}
        />
      </div>
    </SandboxFrameErrorBoundary>
  );
}
