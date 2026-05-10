"use client";

import { useState } from "react";
import { useHermesSkills } from "../../hooks/useHermesSkills";
import { SkillSourceBadge } from "./SkillSourceBadge";
import { HermesEmptyState } from "../shared/HermesEmptyState";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { SkillSource } from "../../types/hermes.types";

export function SkillsTable() {
  const [sourceFilter, setSourceFilter] = useState<SkillSource | "all">("all");
  const [enabledFilter, setEnabledFilter] = useState<"all" | "true" | "false">("all");

  const { skills, query } = useHermesSkills({
    source: sourceFilter === "all" ? undefined : sourceFilter,
    enabled: enabledFilter === "all" ? undefined : enabledFilter === "true",
  });

  return (
    <Card>
      <CardContent className="p-4">
        {/* Filter bar */}
        <div className="mb-4 flex items-center gap-3">
          <Select
            value={sourceFilter}
            onValueChange={(v) => setSourceFilter(v as SkillSource | "all")}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              <SelectItem value="builtin">Builtin</SelectItem>
              <SelectItem value="workspace">Workspace</SelectItem>
              <SelectItem value="user">User</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={enabledFilter}
            onValueChange={(v) => setEnabledFilter(v as "all" | "true" | "false")}
          >
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Enabled" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="true">Enabled</SelectItem>
              <SelectItem value="false">Disabled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        {query.isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-10 rounded bg-muted/50 animate-pulse" />
            ))}
          </div>
        ) : skills.length === 0 ? (
          <HermesEmptyState message="No skills found" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Enabled</TableHead>
                <TableHead>Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {skills.map((skill) => (
                <TableRow key={skill.name}>
                  <TableCell className="font-medium">{skill.name}</TableCell>
                  <TableCell className="max-w-[300px] truncate text-sm text-muted-foreground">
                    {skill.description || "—"}
                  </TableCell>
                  <TableCell><SkillSourceBadge source={skill.source} /></TableCell>
                  <TableCell>
                    <Badge variant={skill.enabled ? "outline" : "secondary"} className={skill.enabled ? "bg-emerald-500/15 text-emerald-600" : ""}>
                      {skill.enabled ? "Enabled" : "Disabled"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {skill.updatedAt ? skill.updatedAt.slice(0, 10) : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
