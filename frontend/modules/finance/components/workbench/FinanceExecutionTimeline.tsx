"use client";

import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineDot,
  TimelineConnector,
  TimelineContent,
} from "@/components/ui/timeline";
import type { AnalysisTask, AnalysisStepStatus } from "../../types/finance.types";

type FinanceExecutionTimelineProps = {
  task?: AnalysisTask | null;
};

function stepStatusToColor(
  status: AnalysisStepStatus
): "success" | "destructive" | "info" | "default" {
  const map: Record<AnalysisStepStatus, "success" | "destructive" | "info" | "default"> = {
    success: "success",
    failed: "destructive",
    running: "info",
    pending: "default",
  };
  return map[status];
}

function stepStatusIcon(status: AnalysisStepStatus) {
  if (status === "success") return "✓";
  if (status === "failed") return "✗";
  if (status === "running") return "◎";
  return "○";
}

export function FinanceExecutionTimeline({
  task,
}: FinanceExecutionTimelineProps) {
  if (!task) {
    return (
      <p className="text-sm text-muted-foreground">暂无执行记录</p>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">
        任务状态：{task.status}
      </p>
      <Timeline position="right">
        {task.steps.map((step, index) => (
          <TimelineItem key={step.stepId}>
            <TimelineSeparator>
              <TimelineDot color={stepStatusToColor(step.status)}>
                {stepStatusIcon(step.status)}
              </TimelineDot>
              {index < task.steps.length - 1 && <TimelineConnector />}
            </TimelineSeparator>
            <TimelineContent>
              <div className="space-y-0.5">
                <p className="text-sm font-medium">{step.name}</p>
                <div className="flex gap-3 text-xs text-muted-foreground">
                  {step.startedAt && (
                    <span>开始: {new Date(step.startedAt).toLocaleTimeString()}</span>
                  )}
                  {step.completedAt && (
                    <span>完成: {new Date(step.completedAt).toLocaleTimeString()}</span>
                  )}
                </div>
              </div>
            </TimelineContent>
          </TimelineItem>
        ))}
      </Timeline>
    </div>
  );
}
