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
import type { AuditEntry } from "../../types/finance.types";

type AuditTrailPanelProps = {
  entries: AuditEntry[];
};

export function AuditTrailPanel({ entries }: AuditTrailPanelProps) {
  if (entries.length === 0) {
    return (
      <Card>
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">暂无审计记录</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">审计轨迹</CardTitle>
      </CardHeader>
      <CardContent>
        <Timeline position="right">
          {entries.map((entry, index) => (
            <TimelineItem key={entry.id}>
              <TimelineSeparator>
                <TimelineDot color="info" />
                {index < entries.length - 1 && <TimelineConnector />}
              </TimelineSeparator>
              <TimelineContent>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{entry.operator}</span>
                    <span className="text-xs text-muted-foreground">
                      {entry.action}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {entry.entityType} / {entry.entityId}
                  </p>
                  {Object.keys(entry.changes).length > 0 && (
                    <div className="text-xs text-muted-foreground">
                      {Object.entries(entry.changes).map(([field, change]) => (
                        <div key={field}>
                          <span className="font-medium">{field}</span>:{" "}
                          {String(change.from)} → {String(change.to)}
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {entry.timestamp}
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
