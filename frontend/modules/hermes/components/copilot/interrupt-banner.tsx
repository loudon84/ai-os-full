/**
 * InterruptBanner - Alert banner shown when the agent is interrupted.
 */
"use client";

import { useHermesInterrupt } from "../../hooks/use-hermes-interrupt";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export function InterruptBanner() {
  const { interrupt } = useHermesInterrupt();

  if (interrupt.status !== "interrupted") return null;

  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{interrupt.title}</AlertTitle>
      <AlertDescription>{interrupt.reason}</AlertDescription>
    </Alert>
  );
}
