"use client";

import * as React from "react";

type SandboxRendererProps = {
  /** 返回 React 元素的函数字符串，签名为 `(props) => React.createElement(...)` */
  code: string;
  props: Record<string, unknown>;
};

type BoundaryState = { error: Error | null };

class SandboxRendererBoundary extends React.Component<
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
          渲染失败：{this.state.error.message}
        </div>
      );
    }
    return this.props.children;
  }
}

function evaluateComponent(
  code: string,
): React.ComponentType<Record<string, unknown>> {
  const trimmed = code.trim();
  const factory = new Function(
    "React",
    `"use strict"; return (${trimmed});`,
  ) as (React: typeof import("react")) => unknown;
  const maybeFn = factory(React);
  if (typeof maybeFn !== "function") {
    throw new Error("组件代码必须解析为函数");
  }
  return maybeFn as React.ComponentType<Record<string, unknown>>;
}

export function SandboxRenderer({ code, props }: SandboxRendererProps) {
  const Comp = React.useMemo(() => evaluateComponent(code), [code]);

  return (
    <SandboxRendererBoundary>
      <Comp {...props} />
    </SandboxRendererBoundary>
  );
}
