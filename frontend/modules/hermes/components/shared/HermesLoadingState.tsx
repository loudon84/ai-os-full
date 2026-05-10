"use client";

import { Skeleton } from "@/components/ui/skeleton";

type HermesLoadingStateProps = {
  rows?: number;
};

export function HermesLoadingState({ rows = 3 }: HermesLoadingStateProps) {
  return (
    <div className="space-y-4">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full" />
      ))}
    </div>
  );
}
