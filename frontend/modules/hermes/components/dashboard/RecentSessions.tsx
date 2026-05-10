"use client";

import Link from "next/link";
import { useHermesSessions } from "../../hooks/useHermesSessions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  idle: "secondary",
  running: "default",
  error: "destructive",
  done: "outline",
};

export function RecentSessions() {
  const { sessions, query } = useHermesSessions({ pageSize: 5, sortOrder: "desc", sortBy: "updatedAt" });

  if (query.isLoading) {
    return <Skeleton className="h-[280px]" />;
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Recent Sessions</CardTitle>
          <Link
            href="/hermes/sessions"
            className="text-xs text-primary hover:underline"
          >
            View all
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {sessions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No sessions found</p>
        ) : (
          <ScrollArea className="h-[200px]">
            <div className="space-y-3">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-start justify-between gap-2 rounded-md border p-2 hover:bg-muted/50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {session.title || session.id}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {session.messageCount} msgs · {session.toolCallCount} tools
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <Badge variant={statusVariant[session.status] ?? "secondary"} className="text-xs">
                      {session.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatRelativeTime(session.updatedAt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

function formatRelativeTime(isoDate: string): string {
  const now = Date.now();
  const then = new Date(isoDate).getTime();
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60_000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}
