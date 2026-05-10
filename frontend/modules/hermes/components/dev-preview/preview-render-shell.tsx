"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { ToolErrorCard } from "../../tool-ui/cards/tool-error-card";
import { ToolLoadingCard } from "../../tool-ui/cards/tool-loading-card";

type PreviewRenderShellProps = {
  title: string;
  toolName: string;
  children?: React.ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
  error: Error | null;
};

class PreviewRenderErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <ToolErrorCard
          title="Render Error"
          message={this.state.error?.message ?? "Unknown error"}
        />
      );
    }
    return this.props.children;
  }
}

export function PreviewRenderShell({
  title,
  toolName,
  children,
}: PreviewRenderShellProps) {
  return (
    <PreviewRenderErrorBoundary>
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-semibold">{title}</h3>
          <Badge variant="outline" className="text-xs">
            {toolName}
          </Badge>
        </div>
        {children ?? <ToolLoadingCard title="Waiting for data" />}
      </div>
    </PreviewRenderErrorBoundary>
  );
}
