"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Inbox } from "lucide-react";

type HermesEmptyStateProps = {
  message: string;
  icon?: React.ReactNode;
};

export function HermesEmptyState({ message, icon }: HermesEmptyStateProps) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center gap-3 p-8">
        {icon ?? <Inbox className="h-10 w-10 text-muted-foreground" />}
        <p className="text-sm text-muted-foreground">{message}</p>
      </CardContent>
    </Card>
  );
}
