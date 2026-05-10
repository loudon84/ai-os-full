"use client";

import { useHermesModels } from "../../hooks/useHermesModels";
import { HealthStatusBadge } from "../shared/HealthStatusBadge";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function ModelsTable() {
  const { models, query } = useHermesModels();

  if (query.isLoading) {
    return <Skeleton className="h-[200px]" />;
  }

  return (
    <Card>
      <CardContent className="p-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Provider</TableHead>
              <TableHead>Model</TableHead>
              <TableHead>Default</TableHead>
              <TableHead>Tools</TableHead>
              <TableHead>Vision</TableHead>
              <TableHead>Health</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {models.map((model) => (
              <TableRow
                key={`${model.provider}-${model.model}`}
                className={cn(model.health !== "healthy" && "border-l-2 border-l-red-500")}
              >
                <TableCell className="text-sm">{model.provider}</TableCell>
                <TableCell className="font-medium">{model.model}</TableCell>
                <TableCell>
                  {model.isDefault ? (
                    <Badge variant="secondary" className="text-xs">Default</Badge>
                  ) : (
                    "—"
                  )}
                </TableCell>
                <TableCell>
                  {model.supportsTools ? <Check className="h-4 w-4 text-emerald-500" /> : <X className="h-4 w-4 text-muted-foreground" />}
                </TableCell>
                <TableCell>
                  {model.supportsVision ? <Check className="h-4 w-4 text-emerald-500" /> : <X className="h-4 w-4 text-muted-foreground" />}
                </TableCell>
                <TableCell>
                  <HealthStatusBadge status={model.health} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
