"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

type HermesErrorStateProps = {
  error?: Error;
  onRetry?: () => void;
  message?: string;
};

export function HermesErrorState({ error, onRetry, message }: HermesErrorStateProps) {
  const displayMessage = message ?? error?.message ?? "An error occurred while loading data.";

  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center gap-4 p-8">
        <AlertCircle className="h-10 w-10 text-destructive" />
        <p className="text-sm text-muted-foreground text-center">{displayMessage}</p>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            Retry
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
