/**
 * ResumeActionBar - Simple confirm & resume action bar
 * for interrupts that only need confirmation (no missing fields).
 */
"use client";

import { useHermesInterrupt } from "../../hooks/use-hermes-interrupt";
import { Button } from "@/components/ui/button";

type Props = {
  onResumeWithConfirmation: () => void;
};

export function ResumeActionBar({ onResumeWithConfirmation }: Props) {
  const { interrupt } = useHermesInterrupt();

  if (interrupt.status !== "interrupted") return null;

  return (
    <div className="flex gap-2">
      <Button onClick={onResumeWithConfirmation}>Confirm & Resume</Button>
    </div>
  );
}
