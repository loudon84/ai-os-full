"use client";

import { useHermesSkills } from "../../hooks/useHermesSkills";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export function SkillsPanel() {
  const { skills, query } = useHermesSkills();

  if (query.isLoading) {
    return <Skeleton className="h-[200px]" />;
  }

  const enabledCount = skills.filter((s) => s.enabled).length;
  const sourceCounts = {
    builtin: skills.filter((s) => s.source === "builtin").length,
    workspace: skills.filter((s) => s.source === "workspace").length,
    user: skills.filter((s) => s.source === "user").length,
  };
  const recentSkills = [...skills]
    .filter((s) => s.updatedAt)
    .sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""))
    .slice(0, 3);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Skills Overview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-sm">
          <span className="font-medium">{enabledCount}</span>
          <span className="text-muted-foreground"> / {skills.length} enabled</span>
        </div>
        <div className="flex flex-wrap gap-1">
          <Badge variant="secondary" className="text-xs">builtin {sourceCounts.builtin}</Badge>
          <Badge variant="secondary" className="text-xs">workspace {sourceCounts.workspace}</Badge>
          <Badge variant="secondary" className="text-xs">user {sourceCounts.user}</Badge>
        </div>
        {recentSkills.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Recently updated</p>
            {recentSkills.map((skill) => (
              <div key={skill.name} className="flex items-center justify-between text-sm">
                <span className="truncate">{skill.name}</span>
                <span className="text-xs text-muted-foreground">
                  {skill.updatedAt?.slice(0, 10)}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
