"use client";

import {
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineDot,
  TimelineConnector,
  TimelineContent,
} from "@/components/ui/timeline";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ReportVersion } from "../../types/finance.types";

type ReportVersionPanelProps = {
  versions: ReportVersion[];
  onVersionSelect?: (version: number) => void;
};

export function ReportVersionPanel({
  versions,
  onVersionSelect,
}: ReportVersionPanelProps) {
  if (versions.length === 0) {
    return (
      <Card>
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">暂无版本记录</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">版本历史</CardTitle>
      </CardHeader>
      <CardContent>
        <Timeline position="right">
          {versions.map((v, index) => (
            <TimelineItem key={v.version}>
              <TimelineSeparator>
                <TimelineDot color="primary" />
                {index < versions.length - 1 && <TimelineConnector />}
              </TimelineSeparator>
              <TimelineContent>
                <div
                  className="cursor-pointer space-y-0.5 hover:bg-muted/50 rounded p-1 -m-1"
                  onClick={() => onVersionSelect?.(v.version)}
                >
                  <p className="text-sm font-medium">
                    版本 {v.version}
                    {v.changeNote && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        {v.changeNote}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {v.createdBy} · {v.createdAt}
                  </p>
                </div>
              </TimelineContent>
            </TimelineItem>
          ))}
        </Timeline>
      </CardContent>
    </Card>
  );
}
